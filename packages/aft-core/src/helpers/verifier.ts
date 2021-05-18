import { BuildInfoPluginManager } from "../plugins/build-info/build-info-plugin-manager";
import { DefectPluginManager } from "../plugins/defects/defect-plugin-manager";
import { DefectStatus } from "../plugins/defects/defect-status";
import { IDefect } from "../plugins/defects/idefect";
import { LoggingPluginManager } from "../plugins/logging/logging-plugin-manager";
import { ITestResult } from "../plugins/test-cases/itest-result";
import { TestCasePluginManager } from "../plugins/test-cases/test-case-plugin-manager";
import { TestStatus } from "../plugins/test-cases/test-status";
import { convert } from "./converter";
import { Func } from "./custom-types";
import { ProcessingResult } from "./processing-result";
import { rand } from "./random-generator";

export class Verifier implements PromiseLike<void> {
    protected _assertion: Func<Verifier, any>;
    protected _expectedResult: any;
    protected _description: string;
    protected _startTime: number;
    protected _innerPromise: Promise<void>;
    protected _tests: Set<string>;
    protected _defects: Set<string>;
    protected _logMgr: LoggingPluginManager;
    protected _testMgr: TestCasePluginManager;
    protected _defectMgr: DefectPluginManager;
    protected _buildMgr: BuildInfoPluginManager;

    constructor() {
        this._startTime = new Date().getTime();
        this._tests = new Set<string>();
        this._defects = new Set<string>();
        this._testMgr = TestCasePluginManager.instance();
        this._defectMgr = DefectPluginManager.instance();
        this._buildMgr = BuildInfoPluginManager.instance();
    }
    
    get logMgr(): LoggingPluginManager {
        if (!this._logMgr) {
            if (this._description) {
                this._logMgr = new LoggingPluginManager({logName: this._description});
            } else if (this._tests) {
                return new LoggingPluginManager({logName: Array.from(this._tests).join('_')});
            } else {
                return new LoggingPluginManager();
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
        if (result != this._expectedResult) {
            return Promise.reject(`expected result of '${this._expectedResult}' to equal actual result of '${result}'`);
        }
    }

    get and(): Verifier {
        return this;
    }

    verify(assertion: Func<Verifier, any>): Verifier {
        this._assertion = assertion;
        return this;
    }

    withDescription(description: string): Verifier {
        this._description = description;
        return this;
    }

    withTests(...tests: string[]): Verifier {
        if (tests?.length) {
            for (var i=0; i<tests.length; i++) {
                let test: string = tests[i];
                this._tests.add(test);
            }
        }
        return this;
    }

    withDefects(...defects: string[]): Verifier {
        if (defects?.length) {
            for (var i=0; i<defects.length; i++) {
                let defect: string = defects[i];
                this._defects.add(defect);
            }
        }
        return this;
    }

    returns(result: any): Verifier {
        this._expectedResult = result;
        return this;
    }

    withLoggingPluginManager(logMgr: LoggingPluginManager): Verifier {
        this._logMgr = logMgr;
        return this;
    }

    withTestCasePluginManager(testMgr: TestCasePluginManager): Verifier {
        this._testMgr = testMgr;
        return this;
    }

    withDefectPluginManager(defectMgr: DefectPluginManager): Verifier {
        this._defectMgr = defectMgr;
        return this;
    }

    withBuildInfoPluginManager(buildMgr: BuildInfoPluginManager): Verifier {
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
     * to the `LoggingPluginManager.logResult` function
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

        let results: ITestResult[] = await this._generateTestResults(status, message, ...this._tests);
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

export const verify = (assertion: Func<Verifier, any>): Verifier => {
    let v: Verifier = new Verifier();
    v.verify(assertion);
    return v;
};