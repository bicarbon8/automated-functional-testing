import { rand, TestResult, TestStatus, Err, AftConfig, ResultsManager, BuildInfoManager, Func, Verifier, Class } from "aft-core";
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

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        this._resMgr = new ResultsManager(this.aftCfg);
        this._buildMgr = new BuildInfoManager(this.aftCfg);
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
        const shouldRun = await this._getVerifier(Verifier).shouldRun();
        return shouldRun.result;
    }

    /**
     * creates a new {Verifier} that will run the passed in `assertion` if the `shouldRun` function
     * returns `true` otherwise it will bypass execution
     * @param assertion a function that performs test actions and will accept a {Verifier} instance
     * for use during the test actions' execution
     * @param verifierType an optional {Verifier} class to use instead of the base {Verifier} type
     * @returns a {Verifier} instance already configured with test cases, description, logger and config
     */
    verify<T extends Verifier>(assertion: Func<T, any>, verifierType?: Class<T>): T {
        return this._getVerifier<T>(verifierType)
            .verify(assertion) as T;
    }

    protected _getVerifier<T extends Verifier>(verifierType?: Class<T>): T {
        verifierType ??= Verifier as Class<T>;
        return new verifierType()
            .internals.usingLogManager(this.logMgr)
            .internals.usingAftConfig(this.aftCfg)
            .withDescription(this.fullTitle)
            .withTestIds(...this.testcases)
            .on('skipped', () => this.test.skip()) as T;
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