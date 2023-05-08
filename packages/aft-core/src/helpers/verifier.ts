import { DefectManager } from "../plugins/defects/defect-manager";
import { Defect } from "../plugins/defects/defect";
import { LogManager } from "../plugins/logging/log-manager";
import { TestResult } from "../plugins/test-cases/test-result";
import { TestCaseManager } from "../plugins/test-cases/test-case-manager";
import { TestStatus } from "../plugins/test-cases/test-status";
import { convert } from "./convert";
import { Func, ProcessingResult } from "./custom-types";
import { rand } from "./rand";
import { equaling, VerifierMatcher } from "./verifier-matcher";
import { Err } from "./err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `TestCasePlugin` and `DefectPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s) or Defect ID(s)
 * 
 * Ex:
 * ```
 * await verify(async (v: Verifier) => {
 *   await v.logMgr.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if TestCasePlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .and.withKnownDefectIds('AUTO-123') // if DefectPlugin.getDefect('AUTO-123').status === 'open' the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export class Verifier implements PromiseLike<void> {
    public readonly aftCfg: AftConfig;

    protected _assertion: Func<Verifier, any>;
    protected _matcher: VerifierMatcher;
    protected _description: string;
    protected _startTime: number;
    protected _innerPromise: Promise<void>;
    protected _tests: Set<string>;
    protected _defects: Set<string>;
    protected _logMgr: LogManager;
    protected _testMgr: TestCaseManager;
    protected _defectMgr: DefectManager;
    protected _buildInfoMgr: BuildInfoManager;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;

        this._startTime = new Date().getTime();
        this._tests = new Set<string>();
        this._defects = new Set<string>();
    }
    
    /**
     * a `LogManager` that uses either the Description
     * or a list of Test Ids or a `uuid` as the `logName` depending
     * on which is available (NOTE: description is preferred most and
     * will be used if other values are also present)
     */
    get logMgr(): LogManager {
        let logName: string;
        if (this._description) {
            logName = this._description;
        } else if (this._tests.size > 0) {
            logName = Array.from(this._tests).join('_');
        } else {
            logName = this.constructor.name;
        }
        if (!this._logMgr) {
            this._logMgr = new LogManager(logName, this.aftCfg);
        }
        return this._logMgr;
    }

    get testMgr(): TestCaseManager {
        if (!this._testMgr) {
            this._testMgr = new TestCaseManager(this.aftCfg);
        }
        return this._testMgr;
    }

    get defectMgr(): DefectManager {
        if (!this._defectMgr) {
            this._defectMgr = new DefectManager(this.aftCfg);
        }
        return this._defectMgr;
    }

    get buildInfo(): BuildInfoManager {
        if (!this._buildInfoMgr) {
            this._buildInfoMgr = new BuildInfoManager(this.aftCfg);
        }
        return this._buildInfoMgr;
    }

    async then<TResult1 = Verifier, TResult2 = never>(onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        return this._getInnerPromise()
        .then(onfulfilled, onrejected);
    }

    protected async _getInnerPromise(): Promise<void> {
        if (!this._innerPromise) {
            this._innerPromise = new Promise(async (resolve, reject) => {
                try {
                    const shouldRun = await this._shouldRunTests(...Array.from(this._tests));
                    if (shouldRun.success) {
                        await this._resolveAssertion();
                        await this._logResult('Passed');
                    } else {
                        await this._logResult('Skipped', shouldRun.message);
                    }
                    resolve();
                } catch(e) {
                    await this._logResult('Failed', e);
                    reject(e);
                }
            });
        }
        return this._innerPromise;
    }

    protected async _resolveAssertion(): Promise<void> {
        let result: any = await Promise.resolve(this._assertion(this));
        if (this._matcher !== undefined) {
            if (!this._matcher.setActual(result).compare()) {
                return Promise.reject(`${this._matcher.failureString()}`);
            }
        }
    }

    /**
     * a syntactic way of connecting fluent functions for the Verifier
     */
    get and(): this {
        return this;
    }

    /**
     * the starting point for setting up a `Verifier` execution. Generally it is preferred
     * to use the `verify(...)` `const` instead of creating individual `Verifier` instances.
     * ex:
     * ```
     * await verify(async (v: Verifier) => {
     *   await v.logMgr.info('doing some testing...');
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
     * run (as returned by your `AbstractTestCasePlugin.shouldRun(testId)`) then
     * the `assertion` will not be run.
     * NOTE: multiple `testId` values can be chained together
     * @param testIds a test identifier for your connected `AbstractTestCasePlugin`
     * @returns this `Verifier` instance
     */
    withTestIds(...testIds: string[]): this {
        if (testIds?.length) {
            for (var i=0; i<testIds.length; i++) {
                this._tests.add(testIds[i]);
            }
        }
        return this;
    }

    /**
     * allows for setting a `defectId` to be checked before executing the `assertion`.
     * if the referenced `defectId` is _open_ then the `assertion` will not be run.
     * @param defectIds a defect identifier for your connected `DefectPlugin`
     * @returns this `Verifier` instance
     */
    withKnownDefectIds(...defectIds: string[]): this {
        if (defectIds?.length) {
            for (var i=0; i<defectIds.length; i++) {
                this._defects.add(defectIds[i]);
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
     * allows for using a specific `LogManager` instance. if not
     * set then one will be created for use by this `Verifier`
     * @param logMgr a `LogManager` instance
     * @returns this `Verifier` instance
     */
    withLogManager(logMgr: LogManager): this {
        this._logMgr = logMgr;
        return this;
    }

    /**
     * allows for using a specific `TestCaseManager` instance. if not
     * set then the global `TestCaseManager.instance()` will be used
     * @param testMgr a `TestCaseManager` instance
     * @returns this `Verifier` instance
     */
    withTestCaseManager(testMgr: TestCaseManager): this {
        this._testMgr = testMgr;
        return this;
    }

    /**
     * allows for using a specific `DefectManager` instance. if not
     * set then the global `DefectManager.instance()` will be used
     * @param defectMgr a `DefectManager` instance
     * @returns this `Verifier` instance
     */
    withDefectManager(defectMgr: DefectManager): this {
        this._defectMgr = defectMgr;
        return this;
    }

    /**
     * allows for using a specific `BuildInfoManager` instance. if not
     * set then the global `BuildInfoManager.instance()` will be used
     * @param buildMgr a `BuildInfoManager` instance
     * @returns this `Verifier` instance
     */
    withAftBuildInfo(buildMgr: BuildInfoManager): this {
        this._buildInfoMgr = buildMgr;
        return this;
    }

    protected async _shouldRunTests(...tests: string[]): Promise<ProcessingResult> {
        const shouldRunTests = new Array<string>();
        const shouldNotRunTests = new Array<string>();
        if (tests?.length) {
            for (var i=0; i<tests.length; i++) {
                let testId: string = tests[i];
                let result: boolean = await this.testMgr.shouldRun(testId);
                if (result === true) {
                    const noOpenDefectsResult = await this._hasNoOpenDefects(testId);
                    if (noOpenDefectsResult.success) {
                        shouldRunTests.push(testId);
                    } else {
                        return noOpenDefectsResult;
                    }
                } else {
                    shouldNotRunTests.push(testId);
                }
            }
            if (shouldRunTests.length === 0) {
                return {success: false, message: `none of the supplied tests should be run: [${tests.join(', ')}]`};
            }
        }
        return {success: true, message: 'returning the test IDs, as an array, that should be run', obj: shouldRunTests};
    }

    /**
     * searches the `DefectManager` for any open defects referencing the supplied `testId` in their title and
     * if found returns a `ProcessingResult` with `success` set to `false` and a message containing a list of the 
     * open defect ID's
     * @param testId the test ID to search for in the `DefectManager`
     * @returns a `ProcessingResult` with `success` equaling `true` if the `testId` has no open defects
     */
    protected async _hasNoOpenDefects(testId: string): Promise<ProcessingResult> {
        let defects: Array<Defect> = await this.defectMgr.findDefects({title: testId}) || new Array<Defect>();
        if (defects.some((d: Defect) => d?.status == 'open')) {
            let openDefects: string = defects
                .filter((d: Defect) => d.status == 'open')
                .map((d: Defect) => d.id)
                .join(', ');
            return {
                success: false, 
                message: `the testId ${testId} has one or more open defects so test should not be run: [${openDefects}]`
            };
        }
        return {
            success: true
        };
    }

    /**
     * creates `TestResult` objects for each `testId` and sends these
     * to the `LogManager.logResult` function
     */
    protected async _logResult(status: TestStatus, message?: string): Promise<void> {
        try {
            status = status || 'Untested';
            if (this._tests.size) {
                this._tests.forEach(async (testId: string) => {
                    if (message) {
                        await this._logMessage(status, `${testId} - ${message}`);
                    } else {
                        await this._logMessage(status, testId);
                    }
                });
            } else {
                await this._logMessage(status, message);
            }

            let results: TestResult[] = await this._generateTestResults(status, message, ...Array.from(this._tests.values()));
            for (var i=0; i<results.length; i++) {
                let result: TestResult = results[i];
                try {
                    await this.logMgr.logResult(result);
                } catch (e) {
                    await this.logMgr.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${Err.short(e)}`);
                }
            }
        } finally {
            await this.logMgr.dispose();
        }
    }

    protected async _logMessage(status: TestStatus, message?: string): Promise<void> {
        message = message || this.logMgr.logName;
        switch (status) {
            case 'Blocked':
            case 'Retest':
            case 'Skipped':
            case 'Untested':
                await this.logMgr.warn(message);
                break;
            case 'Failed':
                await this.logMgr.fail(message);
                break;
            case 'Passed':
            default:
                await this.logMgr.pass(message);
                break;
        }
    }

    protected async _generateTestResults(status: TestStatus, logMessage: string, ...testIds: string[]): Promise<TestResult[]> {
        let results: TestResult[] = [];
        if (testIds.length > 0) {
            for (var i=0; i<testIds.length; i++) {
                let testId: string = testIds[i];
                let result: TestResult = await this._generateTestResult(status, logMessage, testId);
                results.push(result);
            }
        } else {
            let result: TestResult = await this._generateTestResult(status, logMessage);
            results.push(result);
        }
        return results;
    }

    protected async _generateTestResult(status: TestStatus, logMessage: string, testId?: string): Promise<TestResult> {
        let result: TestResult = {
            testId: testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: convert.toElapsedMs(this._startTime),
                buildName: await this.buildInfo.buildName() || 'unknown',
                buildNumber: await this.buildInfo.buildNumber() || 'unknown'
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
 * ```
 * await verify(async (v: Verifier) => {
 *   await v.logMgr.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if TestCasePlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .and.withKnownDefectIds('AUTO-123') // if DefectPlugin.getDefect('AUTO-123').status === 'open' the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export const verify = (assertion: Func<Verifier, any>): Verifier => {
    return new Verifier().verify(assertion);
};