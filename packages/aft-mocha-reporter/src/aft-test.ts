import { ProcessingResult, rand, TestResult, TestStatus, Err, AftConfig, ResultsManager, BuildInfoManager, PolicyEngineManager } from "aft-core";
import { AftLog } from "./aft-log";
import { TitleParser } from "./title-parser";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftLog {
    private readonly _testcases: Array<string>;
    private readonly _resMgr: ResultsManager;
    private readonly _buildMgr: BuildInfoManager;
    private readonly _policyMgr: PolicyEngineManager;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        this._resMgr = new ResultsManager(this.aftCfg);
        this._buildMgr = new BuildInfoManager(this.aftCfg);
        this._policyMgr = new PolicyEngineManager(this.aftCfg);
        this._testcases = TitleParser.parseTestIds(this.fullTitle);
    }

    /**
     * an array of test ID's parsed from the test title where test ID's
     * are expected to be in the surrounded by `[` and `]` like: `"[TESTID]"`
     */
    get testcases(): Array<string> {
        return this._testcases;
    }

    async pass(): Promise<void> {
        await this._logResult('passed');
    }

    async fail(err: any): Promise<void> {
        const message: string = (err.message) ? err.message : String(err);
        const stack: string = (err.stack) ? `\n${err.stack}` : '';
        await this._logResult('failed', `${message}${stack}`);
    }

    async pending(): Promise<void> {
        await this._logResult('skipped', 'test skipped');
    }

    /**
     * determines if any of the referenced Test Case ID's should be run according to the
     * loaded `PolicyEnginePlugin` implementations' `shouldRun` methods
     * @returns `true` if test should be run, otherwise `false`
     */
    async shouldRun(): Promise<boolean> {
        const shouldRunTests = new Array<string>();
        const shouldNotRunTests = new Array<string>();
        if (this.testcases?.length) {
            for (var i=0; i<this.testcases.length; i++) {
                let testId: string = this.testcases[i];
                let result: ProcessingResult<boolean> = await this._policyMgr.shouldRun(testId);
                if (result.result === true) {
                    shouldRunTests.push(testId);
                } else {
                    shouldNotRunTests.push(testId);
                }
            }
            if (shouldRunTests.length === 0) {
                this.logMgr.info(`none of the supplied tests should be run: [${this.testcases.join(', ')}]`);
                return false;
            }
            this.logMgr.debug(`the following supplied tests should be run: [${shouldRunTests.join(', ')}]`);
            return true;
        } else if (this._policyMgr.plugins?.filter(p => Err.handle(() => p?.enabled)).length > 0) {
            this.logMgr.info(`no associated testIds found for test, but enabled 'IPolicyEnginePlugins' exist so test should not be run`);
            return false;
        }
        return true;
    }

    /**
     * creates `ITestResult` objects for each `testId` and sends these
     * to the `LogManager.logResult` function
     * @param result an `IProcessingResult` returned from executing the 
     * expectation
     */
     protected async _logResult(status: TestStatus, message?: string): Promise<void> {
        try {
            status = status || 'untested';
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
                    await this._resMgr.submitResult(result);
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
            case 'blocked':
            case 'retest':
            case 'skipped':
            case 'untested':
                await this.logMgr.warn(message);
                break;
            case 'failed':
                await this.logMgr.fail(message);
                break;
            case 'passed':
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
            testName: this.fullTitle,
            testId: testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: this.test.duration,
                buildName: await this._buildMgr.buildName() || 'unknown',
                buildNumber: await this._buildMgr.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}