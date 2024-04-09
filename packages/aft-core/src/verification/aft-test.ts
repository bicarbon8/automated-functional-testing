import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { PolicyManager } from "../plugins/policy/policy-manager";
import { TestStatus } from "../plugins/reporting/test-status";
import { convert } from "../helpers/convert";
import { Func, ProcessingResult } from "../helpers/custom-types";
import { rand } from "../helpers/rand";
import { equaling, VerifierMatcher } from "./verifier-matcher";
import { Err } from "../helpers/err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { CacheMap } from "../helpers/cache-map";
import { TitleParser } from "./title-parser";

export type AftTestEvent = 'skipped' | 'pass' | 'fail' | 'started' | 'done';

export type AftTestOptions = {
    aftConfig?: AftConfig;
    reporter?: Reporter;
    policyManager?: PolicyManager;
    buildInfoManager?: BuildInfoManager;
    testIds?: Set<string>;
    cacheResultsToFile?: boolean;
    onEventsMap?: Map<AftTestEvent, Array<Func<AftTest, void | PromiseLike<void>>>>;
    haltOnVerifierFailure?: boolean;
};

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `PolicyPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s)
 * 
 * Ex:
 * ```
 * await afttest('[C1234] example usage for AftTest', async (v: AftTest) => {
 *   await v.reporter.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }) // if PolicyPlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value').run();
 * ```
 */
export class AftTest {
    private readonly _options: AftTestOptions;
    private readonly _testFunction: Func<AftTest, void | PromiseLike<void>>;
    private readonly _resultsCache: CacheMap<string, Array<TestResult>>; // { key: description, val: [{TestId: 1, ...}, {TestId: 2, ...}] }

    private _overallStatus: TestStatus;
    private _startTime: number;
    private _endTime: number;

    public readonly description: string;

    constructor(description: string, testFunction: Func<AftTest, void | PromiseLike<void>>, options?: AftTestOptions) {
        this.description = description;
        this._testFunction = testFunction;
        this._options = this._parseOptions(options);
        this._resultsCache = new CacheMap<string, Array<TestResult>>(
            Infinity,
            Boolean(this._options.cacheResultsToFile),
            this.constructor.name
        );
    }

    get aftCfg(): AftConfig {
        if (!this._options.aftConfig) {
            this._options.aftConfig = aftConfig;
        }
        return this._options.aftConfig;
    }
    
    /**
     * a `Reporter` that uses either the Description
     * or a list of Test Ids or `Verifier_<rand8>` as the
     * `logName` depending on which is available (NOTE:
     * description is preferred most and will be used if
     * other values are also present)
     */
    get reporter(): Reporter {
        if (!this._options.reporter) {
            let logName: string;
            if (this.description) {
                logName = this.description;
            } else if (this._options.testIds.size > 0) {
                logName = Array.from(this._options.testIds).join('_');
            } else {
                logName = `${this.constructor.name}_${rand.getString(8, true, true)}`;
            }
            this._options.reporter = new Reporter(logName, this.aftCfg);
        }
        return this._options.reporter;
    }

    get policyManager(): PolicyManager {
        if (!this._options.policyManager) {
            this._options.policyManager = new PolicyManager(this.aftCfg);
        }
        return this._options.policyManager;
    }

    get buildInfoManager(): BuildInfoManager {
        if (!this._options.buildInfoManager) {
            this._options.buildInfoManager = new BuildInfoManager(this.aftCfg);
        }
        return this._options.buildInfoManager;
    }

    async verify(actual: any, expected: any | VerifierMatcher, failureMessage?: string): Promise<void> {
        let syncActual: any;
        if (typeof actual === 'function') {
            const result = await Err.handleAsync(() => actual(), {
                errLevel: 'none'
            });
            // if error then set `actual` to error message otherwise result of function
            syncActual = result.message ?? result.result;
        } else {
            syncActual = actual;
        }
        let matcher: VerifierMatcher;
        if (expected['setActual'] && expected['compare'] && expected['failureString']) {
            matcher = expected;
        } else {
            if (typeof expected === 'function') {
                const result = await Err.handleAsync(() => expected(), {
                    errLevel: 'none'
                });
                // if error then set `expected` to error message otherwise result of function
                expected = result.message ?? result.result;
            }
            matcher = equaling(expected);
        }
        if (!matcher.setActual(syncActual).compare()) {
            // Failure condition
            const errMessage = (failureMessage)
                ? `${failureMessage}\n${matcher.failureString()}`
                : matcher.failureString();
            if (this._options.haltOnVerifierFailure) {
                throw new Error(errMessage);
            } else {
                this._overallStatus = 'failed';
            }
        }
        // otherwise success
    }

    /**
     * executes any `.on('pass')` actions and then submits
     * a 'passed' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async pass(...testIds: Array<string>): Promise<void> {
        await this._throwIfTestIdMismatch(...testIds);
        const passActions = this._options.onEventsMap.get('pass');
        await this._runEventActions(passActions);
        return this._submitResult('passed', null, ...testIds);
    }

    /**
     * executes any `.on('fail')` actions and then submits
     * a 'failed' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async fail(message?: string, ...testIds: Array<string>): Promise<void> {
        await this._throwIfTestIdMismatch(...testIds);
        const err: string = message ?? 'unknown error occurred';
        const failActions = this._options.onEventsMap.get('fail');
        await this._runEventActions(failActions);
        return this._submitResult('failed', err, ...testIds);
    }

    /**
     * executes any `.on('skipped')` actions and then submits
     * a 'skipped' result for each passed in test ID or for
     * the overall result if no `testIds` specified
     * @param testIds an optional array of test IDs
     */
    async pending(message?: string, ...testIds: Array<string>): Promise<void> {
        await this._throwIfTestIdMismatch(...testIds);
        message ??= 'test skipped';
        const skippedActions = this._options.onEventsMap.get('skipped');
        await this._runEventActions(skippedActions);
        return this._submitResult('skipped', message, ...testIds);
    }

    private async _throwIfTestIdMismatch(...testIds: Array<string>): Promise<void> {
        if (testIds.length > 0 && testIds.filter(id => this._options.testIds.has(id)).length === 0) {
            throw new Error(`test IDs [${testIds.join(',')}] do not exist in this Verifier`);
        }
    }

    protected async _started(): Promise<void> {
        await this.reporter.debug('test starting...');
        this._startTime = new Date().getTime();
        const startedActions: Array<Func<AftTest, void | PromiseLike<void>>> = this._options.onEventsMap.get('started');
        await this._runEventActions(startedActions);
    }

    protected async _done(): Promise<void> {
        await this.reporter.debug('test complete');
        this._endTime = new Date().getTime();
        const doneActions: Array<Func<AftTest, void | PromiseLike<void>>> = this._options.onEventsMap.get('done');
        await this._runEventActions(doneActions);
    }

    async run(): Promise<void> {
        try {
            await this._started();
            const shouldRun = await this.shouldRun();
            await this.reporter.debug('verifier.shouldRun response:', shouldRun);
            if (shouldRun.result === true) {
                await Promise.resolve(this._testFunction(this));
                if (this.status === 'failed') {
                    const results = this.getResults()?.filter(r => r.status === 'failed') ?? [];
                    throw new Error(`'${results.length}' failures: [${results.map(r => r.resultMessage).join(',')}]`);
                }
                await this.pass();
            } else {
                await this.pending(shouldRun.message);
            }
        } catch(e) {
            await this.fail(Err.full(e));
            throw e;
        } finally {
            await this._done();
        }
    }

    private async _runEventActions(actions: Array<Func<AftTest, void | PromiseLike<void>>>): Promise<void> {
        if (actions?.length > 0) {
            for (const a of actions) {
                const handled = await Err.handleAsync(async () => a(this), {errLevel: 'none'});
                if (handled.message) {
                    await this.reporter.warn(handled.message);
                }
            }
        }
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
        return this._resultsCache.get(this.description) ?? [];
    }

    /**
     * returns the overall status of this `AftTest`. this value is only updated when
     * a `AftTest.fail(...)` call is made or a `AftTest.verify(actual, expected)` check
     * fails or when the test completes without error. otherwise the value will be
     * 'untested'
     */
    get status(): TestStatus {
        return this._overallStatus ?? 'untested';
    }

    /**
     * returns the amount of time, in milliseconds, elapsed since the `AftTest` was
     * started either by calling the `run` function or using `aftTest(description,
     * testFunction, options)` helper function 
     * 
     * **NOTE**
     * > this includes the time taken to query any `PolicyPlugin` instances
     */
    get elapsed(): number {
        const start: number = this._startTime ?? new Date().getTime();
        const end: number = this._endTime ?? new Date().getTime();
        return end - start;
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
        const testIds = Array.from(this._options.testIds.keys());
        if (testIds?.length) {
            for (const testId of testIds) {
                const result: ProcessingResult<boolean> = await this.policyManager.shouldRun(testId);
                if (result.result === true) {
                    shouldRunTests.push(testId);
                }
            }
            if (shouldRunTests.length === 0) {
                return {result: false, message: `none of the supplied tests should be run: [${testIds.join(', ')}]`};
            }
            return {result: true, message: `the following supplied tests should be run: [${shouldRunTests.join(', ')}]`};
        } else if (this.policyManager.plugins?.filter(p => Err.handle(() => p?.enabled).result).length > 0) {
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
            testIds = (testIds?.length > 0) ? testIds : Array.from(this._options.testIds.values());
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
                buildName: await this.buildInfoManager.buildName() || 'unknown',
                buildNumber: await this.buildInfoManager.buildNumber() || 'unknown'
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

    private _parseOptions(options?: AftTestOptions): AftTestOptions {
        options ??= {};
        options.aftConfig ??= aftConfig;
        options.buildInfoManager ??= new BuildInfoManager(options.aftConfig);
        options.policyManager ??= new PolicyManager(options.aftConfig);
        options.reporter ??= new Reporter(this.description, options.aftConfig);
        options.testIds ??= new Set(TitleParser.parseTestIds(this.description));
        options.cacheResultsToFile ??= false;
        options.onEventsMap ??= new Map<AftTestEvent, Array<Func<AftTest, void | PromiseLike<void>>>>();
        options.haltOnVerifierFailure ??= true;
        return options;
    }
}

/**
 * creates a new `AftTest` instace to be used for executing some Functional
 * Test Assertion.
 * 
 * Ex:
 * ```typescript
 * await afttest('[C1234] example usage for AftTest', async (v: AftTest) => {
 *   await v.reporter.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 * @param description a string describing the test
 * @param assertion the `Func<AftTest, void | PromiseLike<void>>` function to be executed by this `AftTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns a new `AftTest` instance
 */
export const aftTest = async (description: string, assertion: Func<AftTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<void> => {
    return new AftTest(description, assertion, options).run();
};
