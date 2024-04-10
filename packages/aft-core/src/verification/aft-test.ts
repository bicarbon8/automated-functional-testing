import { ReportingManager } from "../plugins/reporting/reporting-manager";
import { TestResult } from "../plugins/reporting/test-result";
import { PolicyManager } from "../plugins/policy/policy-manager";
import { TestStatus } from "../plugins/reporting/test-status";
import { convert } from "../helpers/convert";
import { Func, ProcessingResult } from "../helpers/custom-types";
import { rand } from "../helpers/rand";
import { equaling, VerifyMatcher } from "./verify-matcher";
import { Err } from "../helpers/err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { CacheMap } from "../helpers/cache-map";
import { TitleParser } from "./title-parser";
import { assert } from "console";

export type AftTestFunction = Func<AftTest, void | PromiseLike<void>>;

export type AftTestEvent = 'skipped' | 'pass' | 'fail' | 'started' | 'done';

export type AftTestOptions = {
    aftCfg?: AftConfig;
    reporter?: ReportingManager;
    policyManager?: PolicyManager;
    buildInfoManager?: BuildInfoManager;
    /**
     * an array of test IDs to use if none exist in the `description`
     * passed to this `AftTest` constructor
     * 
     * **NOTE**
     * > passing a `testIds` array will overwrite any pre-existing
     * test IDs parsed from the `description`
     * 
     * @default new Array<string>()
     */
    testIds?: Array<string>;
    /**
     * set to `true` to store each `TestResult` sent by this `AftTest`
     * instance to the filesystem
     * @default false
     */
    cacheResultsToFile?: boolean;
    /**
     * for each type of `AftTestEvent` you can specify an array of actions
     * to be performed like:
     * ```typescript
     * onEventsMap: new Map<AftTestEvent, Array<AftTestFunction>>([
     *     ['started', [() => {console.log('started');}]],
     *     ['pass', [() => {console.log('pass');}]],
     *     ['fail', [() => {console.log('fail');}]],
     *     ['skipped', [() => {console.log('skipped');}]]
     *     ['done', [() => {console.log('done');}]]
     * ])
     * ```
     * @default new Map<AftTestEvent, Array<AftTestFunction>>()
     */
    onEventsMap?: Map<AftTestEvent, Array<AftTestFunction>>;
    /**
     * set to `false` to allow a `testFunction` to continue execution
     * after a failed comparison within a `AftTest.verify(actual, expected)`
     * function
     * @default true
     */
    haltOnVerifyFailure?: boolean;
};

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `PolicyPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s)
 * 
 * ex:
 * ```
 * await aftTest('[C1234] example usage for AftTest', async (v: AftTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), containing('expected value'));
 * }); // if PolicyPlugin.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 */
export class AftTest {
    private readonly _options: AftTestOptions;
    private readonly _testFunction: AftTestFunction;
    private readonly _resultsCache: CacheMap<string, Array<TestResult>>; // { key: description, val: [{TestId: 1, ...}, {TestId: 2, ...}] }

    private _overallStatus: TestStatus;
    private _startTime: number;
    private _endTime: number;

    public readonly description: string;

    constructor(description: string, testFunction?: AftTestFunction, options?: AftTestOptions) {
        this.description = description;
        assert(this.description != null, 'description must be a non-null, defined string value');
        const noTest = () => null;
        this._testFunction = testFunction ?? noTest;
        this._options = this._parseOptions(options);
        this._resultsCache = new CacheMap<string, Array<TestResult>>(
            Infinity,
            Boolean(this._options.cacheResultsToFile),
            this.constructor.name
        );
    }

    get aftCfg(): AftConfig {
        return this._options.aftCfg;
    }
    
    /**
     * a `ReportingManager` that uses the `description` property
     * of this `AftTest` as the `name` or the
     * `ReportingManager` passed in via `AftTestOptions`
     */
    get reporter(): ReportingManager {
        return this._options.reporter;
    }

    /**
     * a `PolicyManager` instance used to determine if
     * this `AftTest` should run by querying all loaded
     * `PolicyPlugin` instances
     */
    get policyManager(): PolicyManager {
        return this._options.policyManager;
    }

    /**
     * a `BuildInfoManager` instance used to generate
     * a Build Number and Build Name from the first loaded
     * `BuildInfoPlugin`
     */
    get buildInfoManager(): BuildInfoManager {
        return this._options.buildInfoManager;
    }

    /**
     * returns an array of `TestResult` objects for each result already submitted
     * _(NOTE: one result is submitted for each associated Test ID)_.
     * if `withFileSystemCache` is enabled this includes searching the filesystem
     * cache for any logged test results for the `AftTest.description` and returning the
     * results as an array of `TestResult` objects with each object corresponding
     * to a Test ID referenced in the test name
     * @returns an array of `TestResult` objects where each entry corresponds to
     * a referenced Test ID parsed from the `AftTest.description`
     */
    get results(): Array<TestResult> {
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
     * an array of `string` values representing the associated test IDs for
     * this `AftTest`. for each test ID a unique result can and will be reported
     * during or on the completion of running the `testFunction`
     * 
     * ex: `["C1234", "C2345"]`
     */
    get testIds(): Array<string> {
        // filter out any duplicates
        return Array.from(new Set(this._options.testIds).values());
    }

    /**
     * performs a comparison of an `actual` and `expected` result. by default any error
     * will result in halting the execution of the `AftTest` and reporting a failure, 
     * but by setting the `haltOnVerifyFailure` option to `false` you can allow the
     * test execution to continue and only report the failure at the completion of running
     * the `testFunction`
     * 
     * ex:
     * ```typescript
     * await aftTest('continue on failure', async (v: AftTest) => {
     *     await v.verify(true, false);
     *     await v.reporter.info('this runs because "haltOnVerifyFailure" is "false"');
     * }, {haltOnVerifyFailure: false});
     * ```
     * @param actual the actual result from some action
     * @param expected the expected result from the action
     * @param failureMessage an optional message to include before any error string
     * when a failure occurs
     */
    async verify(actual: any, expected: any | VerifyMatcher, failureMessage?: string): Promise<ProcessingResult<boolean>> {
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
        let matcher: VerifyMatcher;
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
            this._overallStatus = 'failed';

            const errMessage = (failureMessage)
                ? `${failureMessage}\n${matcher.failureString()}`
                : matcher.failureString();

            if (this._options.haltOnVerifyFailure) {
                throw new Error(errMessage);
            }
            return {result: false, message: errMessage};
        }
        // otherwise success
        return {result: true};
    }

    /**
     * executes any `'pass'` event actions and then submits
     * a `'passed'` result for each passed in test ID or for
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
     * executes any `'fail'` event actions and then submits
     * a `'failed'` result for each passed in test ID or for
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
     * executes any `'skipped'` event actions and then submits
     * a `'skipped'` result for each passed in test ID or for
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

    /**
     * this function handles event actions and checking the `PolicyManager` to
     * determine if the supplied `testFunction` should be run and calling the
     * `pending` function if not. following execution of the `testFunction`
     * this function will call either `pass` or `fail` followed by any `done`
     * actions. if using the `aftTest`helper function then `run` is automatically
     * called
     */
    async run(): Promise<void> {
        try {
            await this._started();
            const shouldRun = await this.shouldRun();
            await this.reporter.debug(`${this.constructor.name}.shouldRun response:`, shouldRun);
            if (shouldRun.result === true) {
                await this._testFunction(this);
                if (this.status === 'failed') {
                    const results = this.results?.filter(r => r.status === 'failed') ?? [];
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

    /**
     * checks if any of the supplied test ids should be run and returns `true` if at least
     * one of them should
     * @param testIds iterates over all test ids checking the `PolicyManager` to see
     * if any should be run and returns `true` if any should be run, otherwise `false`
     * @returns a `ProcessingResult<boolean>` indicating if the testing should proceed
     */
    async shouldRun(): Promise<ProcessingResult<boolean>> {
        const shouldRunTests = new Array<string>();
        const testIds = this.testIds;
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

    private async _throwIfTestIdMismatch(...testIds: Array<string>): Promise<void> {
        if (testIds.length > 0 && testIds.filter(id => this.testIds.includes(id)).length === 0) {
            throw new Error(`test IDs [${testIds.join(',')}] do not exist in this ${this.constructor.name}`);
        }
    }

    protected async _started(): Promise<void> {
        await this.reporter.debug('test starting...');
        this._startTime = new Date().getTime();
        const startedActions: Array<AftTestFunction> = this._options.onEventsMap.get('started');
        await this._runEventActions(startedActions);
    }

    protected async _done(): Promise<void> {
        await this.reporter.debug('test complete');
        this._endTime = new Date().getTime();
        const doneActions: Array<AftTestFunction> = this._options.onEventsMap.get('done');
        await this._runEventActions(doneActions);
    }

    private async _runEventActions(actions: Array<AftTestFunction>): Promise<void> {
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
     * creates `TestResult` objects for each `testId` and sends these
     * to the `ReportingManager.submitResult` function
     */
    protected async _submitResult(status: TestStatus, message?: string, ...testIds: Array<string>): Promise<void> {
        try {
            status ??= 'untested';
            testIds = (testIds?.length > 0) ? testIds : this.testIds;
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
            const cacheArray: Array<TestResult> = this.results;
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
        message ??= '';
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
            testName: this.reporter.name,
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
        const results = this.results;
        for (const result of results) {
            // match on `null` == `undefined` too
            if (testId == result.testId) {
                return true;
            }
        }
        return false;
    }

    protected _parseOptions(options?: AftTestOptions): AftTestOptions {
        options ??= {};
        options.aftCfg ??= aftConfig;
        options.buildInfoManager ??= new BuildInfoManager(options.aftCfg);
        options.policyManager ??= new PolicyManager(options.aftCfg);
        options.reporter ??= new ReportingManager(this.description, options.aftCfg);
        options.testIds ??= TitleParser.parseTestIds(this.description) ?? [];
        options.cacheResultsToFile ??= false;
        options.onEventsMap ??= new Map<AftTestEvent, Array<AftTestFunction>>();
        options.haltOnVerifyFailure ??= true;
        return options;
    }
}

/**
 * creates a new `AftTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * await aftTest('[C1234] example usage for AftTest', async (v: AftTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 * @param description a string describing the test
 * @param testFunction a function of type `AftTestFunction` to be executed by this `AftTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftTest = async (description: string, testFunction: AftTestFunction, options?: AftTestOptions): Promise<void> => {
    return new AftTest(description, testFunction, options).run();
};
