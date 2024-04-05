import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { TestExecutionPolicyManager } from "../plugins/test-execution-policy/test-execution-policy-manager";
import { TestStatus } from "../plugins/reporting/test-status";
import { convert } from "../helpers/convert";
import { Action, Func, ProcessingResult } from "../helpers/custom-types";
import { rand } from "../helpers/rand";
import { equaling, VerifierMatcher } from "./verifier-matcher";
import { Err } from "../helpers/err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { VerifierInternals } from "./verifier-internals";
import { FileSystemMap } from "../helpers/file-system-map";

export type VerifierEvent = 'skipped' | 'pass' | 'fail' | 'started' | 'done';

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `TestExecutionPolicyPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s)
 * 
 * Ex:
 * ```
 * await verify(async (v: Verifier) => {
 *   await v.reporter.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if TestExecutionPolicyPlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export class Verifier implements PromiseLike<void> {
    protected _aftCfg?: AftConfig;
    protected _assertion: Func<Verifier, any>;
    protected _matcher: VerifierMatcher;
    protected _description: string;
    protected _startTime: number;
    protected _innerPromise: Promise<void>;
    protected _testIds: Set<string>;
    protected _reporter: Reporter;
    protected _policyEngMgr: TestExecutionPolicyManager;
    protected _buildInfoMgr: BuildInfoManager;
    protected _actionMap: Map<VerifierEvent, Array<Action<void>>>;
    protected _cacheResults: boolean;
    protected _resultsCache: FileSystemMap<string, Array<TestResult>>; // { key: fullName, val: [{TestId: 1}, {TestId: 2}] }
    
    constructor() {
        this._startTime = new Date().getTime();
        this._testIds = new Set<string>();
        this._actionMap = new Map<VerifierEvent, Array<Action<void>>>();
    }

    get description(): string {
        return this._description ?? this.reporter.loggerName;
    }

    get aftCfg(): AftConfig {
        if (!this._aftCfg) {
            this._aftCfg = aftConfig;
        }
        return this._aftCfg;
    }
    
    /**
     * a `Reporter` that uses either the Description
     * or a list of Test Ids or a `uuid` as the `logName` depending
     * on which is available (NOTE: description is preferred most and
     * will be used if other values are also present)
     */
    get reporter(): Reporter {
        if (!this._reporter) {
            let logName: string;
            if (this._description) {
                logName = this._description;
            } else if (this._testIds.size > 0) {
                logName = Array.from(this._testIds).join('_');
            } else {
                logName = this.constructor.name;
            }
            this._reporter = new Reporter(logName, this.aftCfg);
        }
        return this._reporter;
    }

    get policyEngMgr(): TestExecutionPolicyManager {
        if (!this._policyEngMgr) {
            this._policyEngMgr = new TestExecutionPolicyManager(this.aftCfg);
        }
        return this._policyEngMgr;
    }

    get buildInfoMgr(): BuildInfoManager {
        if (!this._buildInfoMgr) {
            this._buildInfoMgr = new BuildInfoManager(this.aftCfg);
        }
        return this._buildInfoMgr;
    }

    get cacheResults(): boolean {
        return Boolean(this._cacheResults);
    }

    async then<TResult1 = Verifier, TResult2 = never>(
        onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, // eslint-disable-line no-unused-vars
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> { // eslint-disable-line no-unused-vars
            return this._getInnerPromise()
                .then(onfulfilled, onrejected);
    }

    async pass(): Promise<void> {
        const passActions = this._actionMap.get('pass');
        if (passActions?.length) {
            passActions.forEach(a => {
                Err.handle(() => a(), {
                    errLevel: 'debug',
                    logger: this.reporter
                });
            });
        }
        await this.submitResult('passed');
    }

    async fail(message?: string): Promise<void> {
        const err: string = message ?? 'unknown error occurred';
        const failActions = this._actionMap.get('fail');
        if (failActions?.length) {
            failActions.forEach(a => {
                Err.handle(() => a(), {
                    errLevel: 'debug',
                    logger: this.reporter
                });
            });
        }
        await this.submitResult('failed', err);
    }

    async pending(message?: string): Promise<void> {
        message ??= 'test skipped';
        const skippedActions = this._actionMap.get('skipped');
        if (skippedActions?.length) {
            skippedActions.forEach(a => {
                Err.handle(() => a(), {
                    errLevel: 'debug',
                    logger: this.reporter
                });
            });
        }
        await this.submitResult('skipped', message);
    }

    async started(): Promise<void> {
        const startedActions: Array<Action<void>> = this._actionMap.get('started');
        if (startedActions?.length) {
            startedActions.forEach(a => {
                Err.handle(() => a(), {
                    errLevel: 'debug',
                    logger: this.reporter
                });
            });
        }
    }

    async done(): Promise<void> {
        const doneActions = this._actionMap.get('done');
        if (doneActions?.length) {
            doneActions.forEach(a => {
                Err.handle(() => a(), {
                    errLevel: 'debug',
                    logger: this.reporter
                });
            });
        }
    }

    protected async _getInnerPromise(): Promise<void> {
        if (!this._innerPromise) {
            this._innerPromise = new Promise(async (resolve, reject) => { // eslint-disable-line no-async-promise-executor
                try {
                    const shouldRun = await this.shouldRun();
                    await this.reporter.debug('verifier.shouldRun response:', shouldRun);
                    if (shouldRun.result === true) {
                        await this.started();
                        await this._resolveAssertion();
                        await this.pass();
                    } else {
                        await this.pending(shouldRun.message);
                    }
                    resolve();
                } catch(e) {
                    await this.fail(Err.full(e));
                    reject(e);
                }
            });
        }
        await this.done();
        return this._innerPromise;
    }

    protected async _resolveAssertion(): Promise<void> {
        const result: any = await Promise.resolve(this._assertion(this));
        if (this._matcher !== undefined
            && !this._matcher.setActual(result).compare()) {
                return Promise.reject(`${this._matcher.failureString()}`);
        }
        return Promise.resolve();
    }

    /**
     * a syntactic way of connecting fluent functions for the Verifier
     */
    get and(): this {
        return this;
    }

    /**
     * allows for specifying actions to be called on certain events
     * @param event an event trigger
     * @param action the action to be run on the event
     * @returns a reference to this {Verifier} instance
     */
    on(event: VerifierEvent, action: Action<void>): this {
        if (!this._actionMap.has(event)) {
            this._actionMap.set(event, new Array<Action<void>>());
        }
        this._actionMap.get(event).push(action);
        return this;
    }

    /**
     * the starting point for setting up a `Verifier` execution. Generally it is preferred
     * to use the `verify(...)` `const` instead of creating individual `Verifier` instances.
     * ex:
     * ```
     * await verify(async (v: Verifier) => {
     *   await v.reporter.info('doing some testing...');
     *   let feature = new FeatureObj();
     *   return await feature.returnExpectedValue();
     * }).withDescription('example usage for Verifier')
     * .and.withTestId('C1234')
     * .returns('expected value');
     * ```
     * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
     * @returns this `Verifier` instance
     */
    verify(assertion: Func<Verifier, any>): this {
        this._assertion = assertion;
        return this;
    }

    /**
     * allows for setting the `description` to be used as the `logName` in any
     * logging output from this `Verifier`
     * @param description the description of this `Verifier`
     * @returns this `Verifier` instance
     */
    withDescription(description: string): this {
        this._description = description;
        return this;
    }

    /**
     * allows for setting a `testId` to be checked before executing the `assertion`
     * and to be reported to from any connected logging plugins that connect to
     * your test case management system. if all the referenced `testId` values should not be
     * run (as returned by your `TestExecutionPolicyPlugin.shouldRun(testId)`) then
     * the `assertion` will not be run.
     * NOTE: multiple `testId` values can be chained together
     * @param testIds a test identifier for your connected `TestExecutionPolicyPlugin`
     * @returns this `Verifier` instance
     */
    withTestIds(...testIds: string[]): this {
        if (testIds?.length) {
            for (const id of testIds) {
                this._testIds.add(id);
            }
        }
        return this;
    }

    /**
     * allows for specifying either the expected return value or a `VerifierMatcher`
     * to be used to compare the return value using the `VerifierMatcher.compare()`
     * function. if not set then only exceptions will cause a `failed` result on
     * the executed `assertion`
     * @param result the expected result or a `VerifierMatcher` implementation
     * @returns this `Verifier` instance
     */
    returns(result: any | VerifierMatcher): this {
        if (result['compare'] && result['setActual'] && result['failureString']) {
            this._matcher = result;
        } else {
            this._matcher = equaling(result);
        }
        return this;
    }

    /**
     * creates an object exposing internal functions allowing setting custom instances
     * to internal objects
     * @returns a `VerifierInternals` object containing functions allowing users to
     * set values for the `Reporter`, `TestExecutionPolicyManager`, `BuildInfoManager` and
     * `ResultsManager`
     */
    get internals(): VerifierInternals {
        return {
            /**
             * allows for using a specific {AftConfig} instance. if not
             * set then {aftConfig} global const is used
             * @param cfg a {AftConfig} instance
             * @returns this {Verifier} instance
             */
            usingAftConfig: (cfg: AftConfig): this => {
                this._aftCfg = cfg ?? aftConfig;
                return this;
            },
            /**
             * allows for using a specific `Reporter` instance. if not
             * set then one will be created for use by this `Verifier`
             * @param reporter a `Reporter` instance
             * @returns this `Verifier` instance
             */
            usingReporter: (reporter: Reporter): this => {
                this._reporter = reporter;
                return this;
            },

            /**
             * allows for using a specific `TestExecutionPolicyManager` instance. if not
             * set then the global `TestExecutionPolicyManager.instance()` will be used
             * @param policyMgr a `TestExecutionPolicyManager` instance
             * @returns this `Verifier` instance
             */
            usingTestExecutionPolicyManager: (policyMgr: TestExecutionPolicyManager): this => {
                this._policyEngMgr = policyMgr;
                return this;
            },

            /**
             * allows for using a specific `BuildInfoManager` instance. if not
             * set then the global `BuildInfoManager.instance()` will be used
             * @param buildMgr a `BuildInfoManager` instance
             * @returns this `Verifier` instance
             */
            usingBuildInfoManager: (buildMgr: BuildInfoManager): this => {
                this._buildInfoMgr = buildMgr;
                return this;
            },

            /**
             * enables results caching which can be used to prevent sending the same result multiple times
             * when using an external test framework reporter plugin
             * @returns this `Verifier` instance
             */
            withResultsCaching: (): this => {
                this._cacheResults = true;
                this._resultsCache = new FileSystemMap<string, Array<TestResult>>(this.constructor.name, null, this.aftCfg);
                return this;
            },

            /**
             * disables results caching if previously enabled
             * @returns this `Verifier` instance
             */
            withoutResultsCaching: (): this => {
                this._cacheResults = false;
                this._resultsCache?.clear();
                FileSystemMap.removeCacheFile(this.constructor.name);
                return this;
            },

            /**
             * searches the filesystem cache for any logged test results for a named
             * test and returns the results as an array of `TestResult` objects with
             * each object corresponding to a Test ID referenced in the test name
             * @param fullName the full test name under which the results are cached
             * @returns an array of `TestResult` objects for the named test where each
             * entry corresponds to a referenced Test ID parsed from the `fullName`
             */
            getCachedResults: (fullName: string): Array<TestResult> => {
                if (this.cacheResults) {
                    return this._resultsCache.get(fullName) ?? [];
                }
                return [];
            },
        }
    }

    /**
     * checks if any of the supplied test ids should be run and returns `true` if at least
     * one of them should
     * @param testIds iterates over all test ids checking the `TestExecutionPolicyManager` to see
     * if any should be run and returns `true` if any should be run, otherwise `false`
     * @returns a `ProcessingResult<boolean>` indicating if the testing should proceed
     */
    async shouldRun(): Promise<ProcessingResult<boolean>> {
        const shouldRunTests = new Array<string>();
        const testIds = Array.from(this._testIds.keys());
        if (testIds?.length) {
            for (const testId of testIds) {
                const result: ProcessingResult<boolean> = await this.policyEngMgr.shouldRun(testId);
                if (result.result === true) {
                    shouldRunTests.push(testId);
                }
            }
            if (shouldRunTests.length === 0) {
                return {result: false, message: `none of the supplied tests should be run: [${testIds.join(', ')}]`};
            }
            return {result: true, message: `the following supplied tests should be run: [${shouldRunTests.join(', ')}]`};
        } else if (this.policyEngMgr.plugins?.filter(p => Err.handle(() => p?.enabled)).length > 0) {
            return {result: false, message: `no associated testIds found for test, but enabled 'ITestExecutionPolicyPlugins' exist so test should not be run`}
        }
        return {result: true};
    }

    /**
     * creates `TestResult` objects for each `testId` and sends these
     * to the `Reporter.logResult` function
     */
    async submitResult(status: TestStatus, message?: string): Promise<void> {
        try {
            status ??= 'untested';
            if (this._testIds.size) {
                this._testIds.forEach(async (testId: string) => {
                    if (message) {
                        await this._logResultStatus(status, `${testId} - ${message}`);
                    } else {
                        await this._logResultStatus(status, testId);
                    }
                });
            } else {
                await this._logResultStatus(status, message);
            }

            const results: TestResult[] = await this._generateTestResults(status, message, ...Array.from(this._testIds.values()));
            if (this.cacheResults) {
                const cacheKey = this.reporter.loggerName;
                if (!this._resultsCache.has(cacheKey)) {
                    this._resultsCache.set(cacheKey, new Array<TestResult>());
                }
                const cacheArray: Array<TestResult> = this._resultsCache.get(this.reporter.loggerName);
                cacheArray.push(...results);
                this._resultsCache.set(cacheKey, cacheArray);
            }
            for (const result of results) {
                try {
                    await this.reporter.submitResult(result);
                } catch (e) {
                    await this.reporter.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${Err.short(e)}`);
                }
            }
        } finally {
            await this.reporter.finalise();
        }
    }

    protected async _logResultStatus(status: TestStatus, message?: string): Promise<void> {
        message = message || this.reporter.loggerName;
        switch (status) {
            case 'blocked':
            case 'retest':
            case 'skipped':
            case 'untested':
                await this.reporter.warn(message);
                break;
            case 'failed':
                await this.reporter.fail(message);
                break;
            case 'passed':
            default:
                await this.reporter.pass(message);
                break;
        }
    }

    protected async _generateTestResults(status: TestStatus, logMessage: string, ...testIds: string[]): Promise<TestResult[]> {
        const results: TestResult[] = [];
        if (testIds.length > 0) {
            for (const testId of testIds) {
                const result: TestResult = await this._generateTestResult(status, logMessage, testId);
                results.push(result);
            }
        } else {
            const result: TestResult = await this._generateTestResult(status, logMessage);
            results.push(result);
        }
        return results;
    }

    protected async _generateTestResult(status: TestStatus, logMessage: string, testId?: string): Promise<TestResult> {
        const result: TestResult = {
            testName: this.reporter.loggerName,
            testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status,
            metadata: {
                durationMs: convert.toElapsedMs(this._startTime),
                buildName: await this.buildInfoMgr.buildName() || 'unknown',
                buildNumber: await this.buildInfoMgr.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}

/**
 * creates a new `Verifier` instace to be used for executing some Functional
 * Test Assertion.
 * 
 * Ex:
 * ```typescript
 * await verify(async (v: Verifier) => {
 *   await v.reporter.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if TestExecutionPolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export const verify = (assertion: Func<Verifier, any>): Verifier => {
    return new Verifier().verify(assertion);
};
