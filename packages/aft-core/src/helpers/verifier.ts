import { buildinfo, BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { DefectManager, defects } from "../plugins/defects/defect-manager";
import { DefectStatus } from "../plugins/defects/defect-status";
import { IDefect } from "../plugins/defects/idefect";
import { LogManager } from "../plugins/logging/log-manager";
import { ITestResult } from "../plugins/test-cases/itest-result";
import { TestCaseManager, testcases } from "../plugins/test-cases/test-case-manager";
import { TestStatus } from "../plugins/test-cases/test-status";
import { convert } from "./converter";
import { Func } from "./custom-types";
import { ProcessingResult } from "./processing-result";
import { rand } from "./random-generator";
import { Equaling, VerifierMatcher } from "./verifier-matcher";

export class Verifier implements PromiseLike<void> {
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
    protected _buildMgr: BuildInfoManager;

    constructor() {
        this._startTime = new Date().getTime();
        this._tests = new Set<string>();
        this._defects = new Set<string>();
        this._testMgr = testcases;
        this._defectMgr = defects;
        this._buildMgr = buildinfo;
    }
    
    /**
     * a {LogManager} that uses either the {withDescription}
     * or a list of {withTestId} or a uuid as the `logName` depending
     * on which is available and where `description` is preferred most
     */
    get logMgr(): LogManager {
        if (!this._logMgr) {
            if (this._description) {
                this._logMgr = new LogManager({logName: this._description});
            } else if (this._tests.size > 0) {
                return new LogManager({logName: Array.from(this._tests).join('_')});
            } else {
                return new LogManager();
            }
        }
        return this._logMgr;
    }

    async then<TResult1 = Verifier, TResult2 = never>(onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        return this._getInnerPromise()
        .then(onfulfilled, onrejected);
    }

    protected async _getInnerPromise(): Promise<void> {
        if (!this._innerPromise) {
            this._innerPromise = new Promise(async (resolve, reject) => {
                try {
                    let tcShould: ProcessingResult = await this._shouldRun_tests(...Array.from(this._tests));
                    if (tcShould.success) {
                        let dShould: ProcessingResult = await this._shouldRun_defects(...Array.from(this._defects));
                        if (dShould.success) {
                            await this._resolveAssertion();
                            await this._logResult(TestStatus.Passed);
                        } else {
                            await this._logResult(TestStatus.Skipped, dShould.message);
                        }
                    } else {
                        await this._logResult(TestStatus.Skipped, tcShould.message);
                    }
                    resolve();
                } catch(e) {
                    await this._logResult(TestStatus.Failed, e);
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
     * the starting point for setting up a {Verifier} execution. Generally it is preferred
     * to use the {verify(...)} `const` instead of creating individual {Verifier} instances.
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
     * @param assertion the {Func<Verifier, any>} function to be executed by this {Verifier}
     * @returns this {Verifier} instance
     */
    verify(assertion: Func<Verifier, any>): this {
        this._assertion = assertion;
        return this;
    }

    /**
     * allows for setting the `description` to be used as the `logName` in any
     * logging output from this {Verifier}
     * @param description the description of this {Verifier}
     * @returns this {Verifier} instance
     */
    withDescription(description: string): this {
        this._description = description;
        return this;
    }

    /**
     * allows for setting a `testId` to be checked before executing the `assertion`
     * and to be reported to from any connected logging plugins that connect to
     * your test case management system. if all the referenced `testId` values should not be
     * run (as returned by your {AbstractTestCasePlugin.shouldRun(testId)}) then
     * the `assertion` will not be run.
     * NOTE: multiple `testId` values can be chained together
     * @param testId a test identifier for your connected {AbstractTestCasePlugin}
     * @returns this {Verifier} instance
     */
    withTestId(testId: string): this {
        if (testId) {
            this._tests.add(testId);
        }
        return this;
    }

    /**
     * allows for setting a `defectId` to be checked before executing the `assertion`.
     * if the referenced `defectId` is _open_ then the `assertion` will not be run.
     * @param defectId a defect identifier for your connected {AbstractDefectPlugin}
     * @returns this {Verifier} instance
     */
    withKnownDefectId(defectId: string): this {
        if (defectId) {
            this._defects.add(defectId);
        }
        return this;
    }

    /**
     * allows for specifying either the expected return value or a {VerifierMatcher}
     * to be used to compare the return value using the {VerifierMatcher.compare()}
     * function. if not set then only exceptions will cause a `failed` result on
     * the executed `assertion`
     * @param result the expected result or a {VerifierMatcher} implementation
     * @returns this {Verifier} instance
     */
    returns(result: any | VerifierMatcher): this {
        if (result['compare'] && result['setActual'] && result['failureString']) {
            this._matcher = result;
        } else {
            this._matcher = new Equaling(result);
        }
        return this;
    }

    /**
     * allows for using a specific {LogManager} instance. if not
     * set then one will be created for use by this {Verifier}
     * @param logMgr a {LogManager} instance
     * @returns this {Verifier} instance
     */
    withLogManager(logMgr: LogManager): this {
        this._logMgr = logMgr;
        return this;
    }

    /**
     * allows for using a specific {TestCaseManager} instance. if not
     * set then the global {TestCaseManager.instance()} will be used
     * @param testMgr a {TestCaseManager} instance
     * @returns this {Verifier} instance
     */
    withTestCaseManager(testMgr: TestCaseManager): this {
        this._testMgr = testMgr;
        return this;
    }

    /**
     * allows for using a specific {DefectManager} instance. if not
     * set then the global {DefectManager.instance()} will be used
     * @param defectMgr a {DefectManager} instance
     * @returns this {Verifier} instance
     */
    withDefectManager(defectMgr: DefectManager): this {
        this._defectMgr = defectMgr;
        return this;
    }

    /**
     * allows for using a specific {BuildInfoManager} instance. if not
     * set then the global {BuildInfoManager.instance()} will be used
     * @param buildMgr a {BuildInfoManager} instance
     * @returns this {Verifier} instance
     */
    withBuildInfoManager(buildMgr: BuildInfoManager): this {
        this._buildMgr = buildMgr;
        return this;
    }

    protected async _shouldRun_tests(...tests: string[]): Promise<ProcessingResult> {
        let tcResults: ProcessingResult[] = [];
        if (tests?.length) {
            for (var i=0; i<tests.length; i++) {
                let testId: string = tests[i];
                let result: ProcessingResult = await this._testMgr.shouldRun(testId);
                tcResults.push(result);
                if (result.success) {
                    let defects: IDefect[] = await this._defectMgr.findDefects(testId) || [];
                    for (var j=0; j<defects.length; j++) {
                        let d: IDefect = defects[j];
                        if (d?.status == DefectStatus.open) {
                            return {success: false, message: `TestId: '${testId}' has open defect '${d.id}' so test should not be run.`};
                        }
                    }
                }
            }
            let shouldRun: boolean = false;
            for (var i=0; i<tcResults.length; i++) {
                let tcRes: ProcessingResult = tcResults[i];
                shouldRun = shouldRun || tcRes.success;
            }
            if (!shouldRun) {
                return {success: false, message: tcResults.map((r) => r.message || '').join('; ')};
            }
        }
        return {success: true};
    }

    protected async _shouldRun_defects(...defects: string[]): Promise<ProcessingResult> {
        // first search for any specified Defects by ID
        if (defects?.length) {
            for (var i=0; i<defects.length; i++) {
                let defectId: string = defects[i];
                let defect: IDefect = await this._defectMgr.getDefect(defectId);
                if (defect?.status == DefectStatus.open) {
                    return {success: false, message: `Defect: '${defectId}' is open so test should not be run.`};
                }
            }
        }
        return {success: true};
    }

    /**
     * creates `ITestResult` objects for each `testId` and sends these
     * to the `LogManager.logResult` function
     * @param result an `IProcessingResult` returned from executing the 
     * expectation
     */
    protected async _logResult(status: TestStatus, message?: string): Promise<void> {
        status = status || TestStatus.Untested;
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

        let results: ITestResult[] = await this._generateTestResults(status, message, ...Array.from(this._tests.values()));
        for (var i=0; i<results.length; i++) {
            let result: ITestResult = results[i];
            try {
                await this.logMgr.logResult(result);
            } catch (e) {
                await this.logMgr.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${e}`);
            }
        }

        await this.logMgr.dispose();
    }

    protected async _logMessage(status: TestStatus, message?: string): Promise<void> {
        message = message || '';
        switch (status) {
            case TestStatus.Blocked:
            case TestStatus.Retest:
            case TestStatus.Skipped:
            case TestStatus.Untested:
                await this.logMgr.warn(message);
                break;
            case TestStatus.Failed:
                await this.logMgr.fail(message);
                break;
            case TestStatus.Passed:
            default:
                await this.logMgr.pass(message);
                break;
        }
    }

    protected async _generateTestResults(status: TestStatus, logMessage: string, ...testIds: string[]): Promise<ITestResult[]> {
        let results: ITestResult[] = [];
        if (testIds.length > 0) {
            for (var i=0; i<testIds.length; i++) {
                let testId: string = testIds[i];
                let result: ITestResult = await this._generateTestResult(status, logMessage, testId);
                results.push(result);
            }
        } else {
            let result: ITestResult = await this._generateTestResult(status, logMessage);
            results.push(result);
        }
        return results;
    }

    protected async _generateTestResult(status: TestStatus, logMessage: string, testId?: string): Promise<ITestResult> {
        let result: ITestResult = {
            testId: testId,
            created: new Date(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: convert.toElapsedMs(this._startTime),
                statusStr: TestStatus[status],
                buildName: await this._buildMgr.getBuildName() || 'unknown',
                buildNumber: await this._buildMgr.getBuildNumber() || 'unknown'
            }
        };
        return result;
    }
}

/**
 * creates a new {Verifier} instace to be used for executing some Functional
 * Test Assertion.
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
 * @param assertion the {Func<Verifier, any>} function to be executed by this {Verifier}
 * @returns a new {Verifier} instance
 */
export const verify = (assertion: Func<Verifier, any>): Verifier => {
    return new Verifier().verify(assertion);
};