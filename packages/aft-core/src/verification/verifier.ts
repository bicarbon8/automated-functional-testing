import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { PolicyManager } from "../plugins/policy/policy-manager";
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
import { CacheMap } from "../helpers/cache-map";
import { TitleParser } from "../integration/title-parser";

export type VerifierEvent = 'skipped' | 'pass' | 'fail' | 'started' | 'done';

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `PolicyPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s)
 * 
 * Ex:
 * ```
 * await verify(async (v: Verifier) => {
 *   await v.reporter.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if PolicyPlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export class Verifier implements PromiseLike<void> {
    private _aftCfg?: AftConfig;
    private _assertion: Func<Verifier, any>;
    private _matcher: VerifierMatcher;
    private _description: string;
    private _startTime: number;
    private _innerPromise: Promise<void>;
    private _testIds: Set<string>;
    private _reporter: Reporter;
    private _policyEngMgr: PolicyManager;
    private _buildInfoMgr: BuildInfoManager;
    private _actionMap: Map<VerifierEvent, Array<Action<void>>>;
    private _cacheResultsToFile: boolean;
    private _resultsCache: CacheMap<string, Array<TestResult>>; // { key: fullName, val: [{TestId: 1}, {TestId: 2}] }
    private _internals: VerifierInternals;
    
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
     * or a list of Test Ids or `Verifier_<rand8>` as the
     * `logName` depending on which is available (NOTE:
     * description is preferred most and will be used if
     * other values are also present)
     */
    get reporter(): Reporter {
        if (!this._reporter) {
            let logName: string;
            if (this._description) {
                logName = this._description;
            } else if (this._testIds.size > 0) {
                logName = Array.from(this._testIds).join('_');
            } else {
                logName = `${this.constructor.name}_${rand.getString(8, true, true)}`;
            }
            this._reporter = new Reporter(logName, this.aftCfg);
        }
        return this._reporter;
    }

    get policyEngMgr(): PolicyManager {
        if (!this._policyEngMgr) {
            this._policyEngMgr = new PolicyManager(this.aftCfg);
        }
        return this._policyEngMgr;
    }

    get buildInfoMgr(): BuildInfoManager {
        if (!this._buildInfoMgr) {
            this._buildInfoMgr = new BuildInfoManager(this.aftCfg);
        }
        return this._buildInfoMgr;
    }

    /**
     * called either directly using `new Verifier.verify().then((v: Verifier) => {...});` or indirectly using
     * `const v: Verifier = await new Verifier().verify();`
     * @param onfulfilled the function called on successful execution of this
     * Verifier's `verify` function
     * @param onrejected the function called on unsuccessful execution of this
     * Verifier's `verify` function
     * @returns this `Verifier` on success or an `Error` on failure
     */
    async then<TResult1 = Verifier, TResult2 = never>(
        onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, // eslint-disable-line no-unused-vars
        onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> { // eslint-disable-line no-unused-vars
            return this._getInnerPromise()
                .then(onfulfilled, onrejected);
    }

    /**
     * executes any `.on('pass')` actions and then submits
     * a 'passed' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async pass(...testIds: Array<string>): Promise<void> {
        if (testIds.length > 0 && testIds.filter(id => this._testIds.has(id)).length === 0) {
            return Promise.reject(`test IDs [${testIds.join(',')}] do not exist in this Verifier`);
        }
        const passActions = this._actionMap.get('pass');
        if (passActions?.length) {
            passActions.forEach(async a => {
                const handledPass = Err.handle(() => a());
                if (handledPass.message) {
                    await this.reporter.warn(handledPass.message);
                }
            });
        }
        return this._submitResult('passed', null, ...testIds);
    }

    /**
     * executes any `.on('fail')` actions and then submits
     * a 'failed' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async fail(message?: string, ...testIds: Array<string>): Promise<void> {
        if (testIds.length > 0 && testIds.filter(id => this._testIds.has(id)).length === 0) {
            return Promise.reject(`test IDs [${testIds.join(',')}] do not exist in this Verifier`);
        }
        const err: string = message ?? 'unknown error occurred';
        const failActions = this._actionMap.get('fail');
        if (failActions?.length) {
            failActions.forEach(async a => {
                const handledFail = Err.handle(() => a());
                if (handledFail.message) {
                    await this.reporter.warn(handledFail.message);
                }
            });
        }
        return this._submitResult('failed', err, ...testIds);
    }

    /**
     * executes any `.on('skipped')` actions and then submits
     * a 'skipped' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async pending(message?: string, ...testIds: Array<string>): Promise<void> {
        if (testIds.length > 0 && testIds.filter(id => this._testIds.has(id)).length === 0) {
            return Promise.reject(`test IDs [${testIds.join(',')}] do not exist in this Verifier`);
        }
        message ??= 'test skipped';
        const skippedActions = this._actionMap.get('skipped');
        if (skippedActions?.length) {
            skippedActions.forEach(async a => {
                const handledSkip = Err.handle(() => a());
                if (handledSkip.message) {
                    await this.reporter.warn(handledSkip.message);
                }
            });
        }
        return this._submitResult('skipped', message, ...testIds);
    }

    protected async _started(): Promise<void> {
        const startedActions: Array<Action<void>> = this._actionMap.get('started');
        if (startedActions?.length) {
            startedActions.forEach(async a => {
                const handledStart = Err.handle(() => a());
                if (handledStart.message) {
                    await this.reporter.warn(handledStart.message);
                }
            });
        }
    }

    protected async _done(): Promise<void> {
        const doneActions = this._actionMap.get('done');
        if (doneActions?.length) {
            doneActions.forEach(async a => {
                const handledDone = Err.handle(() => a());
                if (handledDone.message) {
                    await this.reporter.warn(handledDone.message);
                }
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
                        await this._started();
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
                await this._done();
            });
        }
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
     * .and.withTestIds('C1234')
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
        if (this._description) {
            const testIds: Array<string> = TitleParser.parseTestIds(this._description);
            if (testIds?.length > 0) {
                this.internals.withTestIds(...testIds); // eslint-disable-line
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
     * returns an array of `TestResult` objects for each result already submitted
     * _(NOTE: one result is submitted for each associated Test ID)_.
     * if `withFileSystemCache` is enabled this includes searching the filesystem
     * cache for any logged test results for the `Verifier.description` and returning the
     * results as an array of `TestResult` objects with each object corresponding
     * to a Test ID referenced in the test name
     * @returns an array of `TestResult` objects where each entry corresponds to
     * a referenced Test ID parsed from the `Verifier.description`
     */
    getResults(): Array<TestResult> {
        if (!this._resultsCache) {
            // lazy init to allow time for `this._cacheResultsToFile` to be set
            this._resultsCache = new CacheMap<string, Array<TestResult>>(
                Infinity,
                Boolean(this._cacheResultsToFile),
                this.constructor.name
            );
        }
        return this._resultsCache.get(this.description) ?? [];
    }

    /**
     * creates an object exposing internal functions allowing setting custom instances
     * to internal objects
     * @returns a `VerifierInternals` object containing functions allowing users to
     * set values for the `Reporter`, `PolicyManager`, `BuildInfoManager` and
     * `ResultsManager`
     */
    get internals(): VerifierInternals {
        if (!this._internals) {
            this._internals = {
                usingAftConfig: (cfg: AftConfig): this => {
                    this._aftCfg = cfg ?? aftConfig;
                    return this;
                },
                usingReporter: (reporter: Reporter): this => {
                    this._reporter = reporter;
                    return this;
                },
                usingPolicyManager: (policyMgr: PolicyManager): this => {
                    this._policyEngMgr = policyMgr;
                    return this;
                },
                usingBuildInfoManager: (buildMgr: BuildInfoManager): this => {
                    this._buildInfoMgr = buildMgr;
                    return this;
                },
                withFileSystemCache: (): this => {
                    this._cacheResultsToFile = true;
                    return this;
                },
                withoutFileSystemCache: (): this => {
                    this._cacheResultsToFile = false;
                    FileSystemMap.removeCacheFile(this.constructor.name);
                    return this;
                },
                withTestIds: (...testIds: Array<string>): this => {
                    this._testIds.clear();
                    if (testIds?.length) {
                        for (const id of testIds) {
                            this._testIds.add(id);
                        }
                    }
                    return this;
                }
            }
        }
        return this._internals;
    }

    /**
     * checks if any of the supplied test ids should be run and returns `true` if at least
     * one of them should
     * @param testIds iterates over all test ids checking the `PolicyManager` to see
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
        } else if (this.policyEngMgr.plugins?.filter(p => Err.handle(() => p?.enabled).result).length > 0) {
            return {result: false, message: `no associated testIds found for test, but enabled 'IPolicyPlugins' exist so test should not be run`}
        }
        return {result: true};
    }

    /**
     * creates `TestResult` objects for each `testId` and sends these
     * to the `Reporter.submitResult` function
     */
    protected async _submitResult(status: TestStatus, message?: string, ...testIds: Array<string>): Promise<void> {
        try {
            status ??= 'untested';
            testIds = (testIds?.length > 0) ? testIds : Array.from(this._testIds.values());
            if (testIds?.length > 0) {
                testIds.forEach(async (testId: string) => {
                    if (!this._hasResult(testId)) {
                        if (message) {
                            await this._logResultStatus(status, `${testId} - ${message}`);
                        } else {
                            await this._logResultStatus(status, testId);
                        }
                    }
                });
            } else {
                if (!this._hasResult()) {
                    await this._logResultStatus(status, message);
                }
            }

            const results: TestResult[] = await this._generateTestResults(status, message, ...testIds);
            const cacheArray: Array<TestResult> = this.getResults();
            cacheArray.push(...results);
            this._resultsCache.set(this.description, cacheArray);
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
                if (!this._hasResult(testId)) {
                    const result: TestResult = await this._generateTestResult(status, logMessage, testId);
                    results.push(result);
                }
            }
        } else {
            if (!this._hasResult()) {
                const result: TestResult = await this._generateTestResult(status, logMessage);
                results.push(result);
            }
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

    protected _hasResult(testId: string = null): boolean {
        const results = this.getResults();
        for (const result of results) {
            // match on `null` == `undefined` too
            if (testId == result.testId) {
                return true;
            }
        }
        return false;
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
 * .and.withTestIds('C1234') // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export const verify = (assertion: Func<Verifier, any>): Verifier => {
    return new Verifier().verify(assertion);
};
