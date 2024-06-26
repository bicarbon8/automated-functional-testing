import { ReportingManager } from "../plugins/reporting/reporting-manager";
import { TestResult } from "../plugins/reporting/test-result";
import { PolicyManager } from "../plugins/policy/policy-manager";
import { TestStatus } from "../plugins/reporting/test-status";
import { convert } from "../helpers/convert";
import { Func, Merge, ProcessingResult } from "../helpers/custom-types";
import { rand } from "../helpers/rand";
import { equaling, havingProps, VerifyMatcher } from "./verify-matcher";
import { Err } from "../helpers/err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { CacheMap } from "../helpers/cache-map";
import { TitleParser } from "./title-parser";
import { assert } from "console";
import { AftTestFailError, AftTestPassError, AftTestPendingError } from "./aft-test-errors";

export class AftTestConfig {
    /**
     * set to `true` to allow submitting results for test IDs not included
     * in the `testIds` array or within the `description` (otherwise an
     * exception is thrown)
     * @default false
     */
    allowAnyTestId: boolean = false;
    /**
     * set to `false` to allow a `testFunction` to continue execution
     * after a failed comparison within a `AftTest.verify(actual, expected)`
     * function
     * @default true
     */
    haltOnVerifyFailure: boolean = true;
    /**
     * a Javascript object containing key value pairs to be included in the
     * `metadata` section of all submitted `TestResult` objects.
     * 
     * **NOTE**
     * > this is added before any default values so it could be
     * overwritten by values such as `durationMs`, `buildNumber`
     * and `buildName` if the same keys are used
     */
    additionalMetadata: {} = {};
}

export type AftTestFunction = Func<AftTest, void | PromiseLike<void>>;

export type AftTestEvent = 'skipped' | 'pass' | 'fail' | 'started' | 'done';

export type AftTestOptions = Merge<Partial<AftTestConfig>, {
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
     * set to `true` to store each `TestResult` sent by this `AftTest`
     * instance to the filesystem
     * 
     * **NOTE**
     * > this should only be set to `true` by external reporter `AftXYZTest`
     * instances to prevent double reporting results when the reporter runs
     * @default false
     */
    _cacheResultsToFile?: boolean;
    /**
     * set to `true` to prevent clearing any existing cached results in
     * the constructor on instantiation
     * 
     * **NOTE**
     * > this should only be set to `true` from within external reporter
     * instances to prevent double reporting results
     * @default false
     */
    _preventCacheClear?: boolean;
}>;

/**
 * class to be used for executing some Test Function after checking with the
 * `PolicyManager` to confirm that the `testFunction` should be executed based
 * on referenced Test ID(s) or lack thereof
 * 
 * ex:
 * ```
 * await aftTest('[C1234] example usage for AftTest', async (v: AftTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), containing('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the `testFunction` is not run
 * ```
 */
export class AftTest {
    private readonly _options: AftTestOptions;
    private readonly _testFunction: AftTestFunction;
    private readonly _resultsCache: CacheMap<string, Array<TestResult>>; // { key: description, val: [{TestId: 1, ...}, {TestId: 2, ...}] }
    
    private _startTime: number;
    private _endTime: number;
    
    public readonly description: string;

    constructor(description: string, testFunction?: AftTestFunction, options?: AftTestOptions) {
        this.description = description;
        assert(this.description != null, 'description must be a non-null, defined string value');
        const noTest = () => null;
        this._testFunction = testFunction ?? noTest;
        this._options = this._parseOptionsAndSetDefaults(options);
        this._resultsCache = new CacheMap<string, Array<TestResult>>(
            Infinity,
            Boolean(this._options._cacheResultsToFile),
            this.constructor.name
        );
        if (!this._options._preventCacheClear) {
            this._resultsCache.set(this.description, []);
        }
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
     * via a call to `verify`, `pass`, `fail` or `pending` or the completion of
     * the `testFunction` execution within the `run` function
     * #### NOTE:
     * > one result is submitted for each associated Test ID or just one
     * overall result if no Test IDs are associated with this instance
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
        const results = this.results;
        if (results.length > 0) {
            if (results.some(r => r.status === 'failed')) {
                return 'failed';
            }
            if (results.every(r => r.status === 'skipped')) {
                return 'skipped';
            }
            if (results.every(r => r.status === 'passed')) {
                return 'passed';
            }
        }
        return 'untested';
    }

    /**
     * returns the amount of time, in milliseconds, elapsed since the `AftTest` was
     * started either by calling the `run` function or using `aftTest(description,
     * testFunction, options)` helper function until it ended or now if not yet
     * done
     * 
     * **NOTE**
     * > this includes the time taken to query any `PolicyPlugin` instances
     */
    get elapsed(): number {
        const start: number = this._startTime ?? Date.now();
        return convert.toElapsedMs(start, this._endTime);
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
     * // no message and continues on verify failure
     * await aftTest('continue on failure', async (v: AftTest) => {
     *     await v.verify(true, false);
     *     // below will run because "haltOnVerifyFailure" is "false"
     *     // but overall status will be 'failed' because above
     *     // call fails
     *     await v.verify(true, true);
     * }, {haltOnVerifyFailure: false});
     * 
     * // message with test ID (failure)
     * await aftTest('[C1234] error on failure', async (v: AftTest) => {
     *     // submits `TestResult` for test ID `C1234` with `status='failed'`
     *     // and `message="C1234 - expected 'false' to be 'true'"`
     *     await v.verify(true, false, '[C1234]');
     * });
     * 
     * // message with test ID (success)
     * await aftTest('[C1234] successful test', async (v: AftTest) => {
     *     // submits `TestResult` for test ID `C1234` with `status='passed'`
     *     await v.verify(true, true, '[C1234]');
     * });
     * ```
     * @param actual the actual result from some action
     * @param expected the expected result from the action
     * @param message an optional message to include before any error string
     * when a failure occurs. this may also include any test ID(s) in the form
     * `"...[TestID]..."` and if included will result in a call to `pass` or `fail`
     * with the associated test ID(s)
     * @returns a `ProcessingResult<boolean>` where `ProcessingResult.result === true`
     * equates to success and `ProcessingResult.result !== true` equates to failure.
     * #### NOTE:
     * > if a `message` argument is passed to the `verify` call then it will be included
     * in the `message` property of the returned `ProcessingResult`
     */
    async verify(actual: any, expected: any | VerifyMatcher, message?: string): Promise<ProcessingResult<boolean>> {
        const verifyResult: ProcessingResult<boolean> = {result: true, message};
        const testIds: Array<string> = TitleParser.parseTestIds(message ?? '');
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
        if (havingProps(['setActual', 'compare', 'failureString']).setActual(expected).compare()) {
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
            const resultMessage = (verifyResult.message)
                ? `${verifyResult.message} - ${matcher.failureString()}`
                : matcher.failureString();

            if (this._options.haltOnVerifyFailure) {
                throw new Error(resultMessage);
            }
            verifyResult.result = false
            verifyResult.message = resultMessage;
        }
        await this._submitResult((verifyResult.result === true) ? 'passed' : 'failed', verifyResult.message, ...testIds);
        return verifyResult;
    }

    /**
     * executes any `'pass'` event actions after submitting
     * a `'passed'` result for each associated test ID and then
     * throws a `AftTestPassError` to halt execution of the
     * `testFunction` (if running)
     */
    async pass(): Promise<void> {
        await this._submitRemainingResults('passed');
        const passActions = this._options.onEventsMap.get('pass');
        await this._runEventActions(passActions);
        throw new AftTestPassError();
    }

    /**
     * executes any `'fail'` event actions after submitting
     * a `'failed'` result for each associated test ID and then
     * throws a `AftTestFailError` to halt execution of the
     * `testFunction` (if running)
     * @param message an optional message to describe why the test
     * is being marked as `'failed'` @default "unknown error occurred"
     */
    async fail(message?: string): Promise<void> {
        message ??= 'unknown error occurred';
        await this._submitRemainingResults('failed', message);
        const failActions = this._options.onEventsMap.get('fail');
        await this._runEventActions(failActions);
        throw new AftTestFailError(message);
    }

    /**
     * executes any `'skipped'` event actions after submitting
     * a `'skipped'` result for each associated test ID and then
     * throws a `AftTestPendingError` to halt execution of the
     * `testFunction` (if running)
     * @param message an optional message to describe why the test
     * is being skipped @default "test skipped"
     */
    async pending(message?: string): Promise<void> {
        message ??= 'test skipped';
        await this._submitRemainingResults('skipped', message);
        const skippedActions = this._options.onEventsMap.get('skipped');
        await this._runEventActions(skippedActions);
        throw new AftTestPendingError(message);
    }

    /**
     * this function handles event actions and checking the `PolicyManager` to
     * determine if the supplied `testFunction` should be run. immediately prior
     * to executing the `testFunction` the `_started` function is called
     * followed by execution of the `testFunction` and then calling `_done`
     * 
     * **NOTE**
     * > if using the `aftTest` helper function then `run` is automatically
     * called, otherwise it must manually be called to run the `testFunction`
     * @returns this `AftTest` instance
     */
    async run(): Promise<this> {
        try {
            await this._started();
            const shouldRun = await this.shouldRun();
            await this.reporter.trace(`${this.constructor.name}.shouldRun response:`, shouldRun);
            if (shouldRun.result === true) {
                await this._testFunction(this);
                if (this.status === 'failed') {
                    const results = this.results?.filter(r => r.status === 'failed') ?? [];
                    throw new Error(`'${results.length}' failures: [${results.map(r => r.resultMessage).join(',')}]`);
                }
            } else {
                await this._submitResult('skipped', shouldRun.message, ...this.testIds);
            }
        } catch(e) {
            if (e instanceof AftTestPassError) {
                await this._submitRemainingResults('skipped', e.message);
            } else if (e instanceof AftTestPendingError) {
                await this._submitRemainingResults('skipped', e.message);
            } else {
                await this._submitRemainingResults('failed', Err.full(e));
                throw e;
            }
        } finally {
            await this._done();
        }
        return this;
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
        if (testIds?.length > 0) {
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
        } else if (this.policyManager.plugins?.length > 0) {
            return {result: false, message: `no associated testIds found for test, but enabled 'PolicyPlugins' exist so test should not be run`}
        }
        return {result: true};
    }

    private _throwIfTestIdMismatch(...testIds: Array<string>): void {
        if (testIds.length > 0 && this._options.allowAnyTestId !== true && testIds.filter(id => this.testIds.includes(id)).length === 0) {
            throw new Error(`test IDs [${testIds.join(',')}] do not exist in this ${this.constructor.name}`);
        }
    }

    protected async _started(): Promise<void> {
        await this.reporter.trace('test starting...');
        this._startTime = Date.now();
        const startedActions: Array<AftTestFunction> = this._options.onEventsMap.get('started');
        await this._runEventActions(startedActions);
    }

    protected async _done(): Promise<void> {
        await this.reporter.trace(`test complete - status: ${this.status}`);
        this._endTime = Date.now();
        await this._submitRemainingResults('passed');
        const doneActions: Array<AftTestFunction> = this._options.onEventsMap.get('done');
        await this._runEventActions(doneActions);
    }

    private async _runEventActions(actions: Array<AftTestFunction>): Promise<void> {
        if (actions?.length > 0) {
            for (const a of actions) {
                const handled = await Err.handleAsync(() => a(this), {errLevel: 'none'});
                if (handled.message) {
                    await this.reporter.warn(handled.message);
                }
            }
        }
    }

    protected async _submitRemainingResults(status: TestStatus, message?: string): Promise<void> {
        if (this.results.length === 0 || this.testIds.length > 0) {
            if (this.testIds.length === 0) {
                await this._submitResult(status, message);
            } else {
                const untestedIds = this.testIds.filter(id => !this._testIdHasResult(id));
                if (untestedIds.length > 0) {
                    await this._submitResult(status, message, ...untestedIds);
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
            this._throwIfTestIdMismatch(...testIds);
            if (testIds?.length > 0) {
                testIds.forEach(async (testId: string) => {
                    if (message) {
                        await this._logResultStatus(status, `${testId} - ${message}`);
                    } else {
                        await this._logResultStatus(status, testId);
                    }
                });
            } else {
                await this._logResultStatus(status, message);
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
                const result: TestResult = await this._generateTestResult(status, logMessage, testId);
                results.push(result);
            }
        } else {
            const result: TestResult = await this._generateTestResult(status, logMessage);
            results.push(result);
        }
        return results;
    }

    protected async _generateTestResult(status: TestStatus, resultMessage: string, testId?: string): Promise<TestResult> {
        const result: TestResult = {
            testName: this.reporter.name,
            testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage,
            status,
            metadata: {
                ...this._options.additionalMetadata,
                durationMs: this.elapsed,
                buildName: await this.buildInfoManager.buildName() ?? 'unknown',
                buildNumber: await this.buildInfoManager.buildNumber() ?? 'unknown'
            }
        };
        return result;
    }

    protected _testIdHasResult(testId: string): boolean {
        // use '==' for testId comparisons to allow 'null' to match 'undefined'
        return this.results.some(r => r.testId == testId);
    }

    protected _parseOptionsAndSetDefaults(options?: AftTestOptions): AftTestOptions {
        options ??= {};
        options.aftCfg ??= aftConfig;
        options.buildInfoManager ??= new BuildInfoManager(options.aftCfg);
        options.policyManager ??= new PolicyManager(options.aftCfg);
        options.reporter ??= new ReportingManager(this.description, options.aftCfg);
        options.testIds ??= TitleParser.parseTestIds(this.description) ?? [];
        options._cacheResultsToFile ??= false;
        options.onEventsMap ??= new Map<AftTestEvent, Array<AftTestFunction>>();
        const testCfg = options.aftCfg.getSection(AftTestConfig);
        options.haltOnVerifyFailure ??= testCfg.haltOnVerifyFailure ?? true;
        options.allowAnyTestId ??= testCfg.allowAnyTestId ?? false;
        options.additionalMetadata ??= testCfg.additionalMetadata ?? {};
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
 * @returns an async `Promise<AftTest>` that runs the passed in `testFunction`
 */
export const aftTest = async (description: string, testFunction: AftTestFunction, options?: AftTestOptions): Promise<AftTest> => {
    return new AftTest(description, testFunction, options).run();
};
