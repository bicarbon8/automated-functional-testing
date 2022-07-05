import { buildinfo, ProcessingResult, rand, TestResult, TestStatus } from "aft-core";
import { AftLog } from "./aft-log";
import { shouldRun } from "./should-run";
import { TitleParser } from "./title-parser";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftLog {
    private _testcases: Array<string>;
    private _defects: Array<string>;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any) {
        super(scope);
    }

    get testcases(): Array<string> {
        if (!this._testcases) {
            this._testcases = TitleParser.parseTestIds(this.fullName);
        }
        return this._testcases;
    }

    get defects(): Array<string> {
        if (!this._defects) {
            this._defects = TitleParser.parseDefectIds(this.fullName);
        }
        return this._defects;
    }

    async pass(): Promise<void> {
        await this._logResult('Passed');
    }

    async fail(): Promise<void> {
        let err: string = 'unknown error occurred';
        if (this.test?.failedExpectations) {
            err = this.test.failedExpectations.map(e => `${e.message}\n${e.stack}`).join('\n');
        }
        await this._logResult('Failed', err);
    }

    async pending(): Promise<void> {
        await this._logResult('Skipped', 'test skipped');
    }

    async shouldRun(): Promise<boolean> {
        let result: boolean = true;

        const should: Array<ProcessingResult> = await Promise.all([
            shouldRun.tests(...this.testcases),
            shouldRun.defects(...this.defects)
        ]).catch(async (err) => {
            await this.logMgr.warn(err);
            return [];
        });
        if (should?.length) {
            if (!should.map(s => s.success).reduce((prev, curr) => prev && curr)) {
                result = false;
                await this.logMgr.warn(should.filter(s => !s.success).map(s => s.message).join('; '));
            }
        }

        return result;
    }

    async dispose(): Promise<void> {
        await this.logMgr.dispose();
    }

    /**
     * creates `ITestResult` objects for each `testId` and sends these
     * to the `LogManager.logResult` function
     * @param result an `IProcessingResult` returned from executing the 
     * expectation
     */
     protected async _logResult(status: TestStatus, message?: string): Promise<void> {
        try {
            status = status || 'Untested';
            if (this.testcases.length) {
                this.testcases.forEach(async (testId: string) => {
                    if (message) {
                        await this._logMessage(status, `${testId} - ${message}`);
                    } else {
                        await this._logMessage(status, testId);
                    }
                });
            } else {
                await this._logMessage(status, message);
            }

            let results: TestResult[] = await this._generateTestResults(status, message, ...this.testcases);
            for (var i=0; i<results.length; i++) {
                let result: TestResult = results[i];
                try {
                    await this.logMgr.logResult(result);
                } catch (e) {
                    await this.logMgr.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${e}`);
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
                durationMs: this.test.duration || 0,
                buildName: await buildinfo.buildName() || 'unknown',
                buildNumber: await buildinfo.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}