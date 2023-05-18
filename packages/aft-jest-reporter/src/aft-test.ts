import { rand, TestResult, TestStatus, Err, AftConfig, BuildInfoManager, Verifier, Func, Class } from "aft-core";
import { AftLog } from "./aft-log";
import { TitleParser } from "./title-parser";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftLog {
    private _testcases: Array<string>;
    private readonly _buildMgr: BuildInfoManager;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        this._buildMgr = new BuildInfoManager(this.aftCfg);
    }

    get buildInfoMgr(): BuildInfoManager {
        return this._buildMgr;
    }

    get testcases(): Array<string> {
        if (!this._testcases) {
            this._testcases = TitleParser.parseTestIds(this.fullName);
        }
        return this._testcases;
    }

    async pass(): Promise<void> {
        await this._logResult('passed');
    }

    async fail(): Promise<void> {
        let err: string = 'unknown error occurred';
        if (this.test?.failureMessages) {
            err = this.test.failureMessages.join('\n');
        }
        await this._logResult('failed', err);
    }

    async skipped(): Promise<void> {
        await this._logResult('skipped', 'test skipped');
    }

    /**
     * determines if any of the referenced Test Case ID's should be run according to the
     * loaded `TestExecutionPolicyPlugin` implementations' `shouldRun` methods
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
            .internals.usingReporter(this.reporter)
            .internals.usingAftConfig(this.aftCfg)
            .withDescription(this.fullName)
            .withTestIds(...this.testcases)
            .on('skipped', () => pending()) as T;
    }

    async dispose(): Promise<void> {
        await this.reporter.dispose();
    }

    /**
     * creates `ITestResult` objects for each `testId` and sends these
     * to the `Reporter.logResult` function
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
                    await this.reporter.submitResult(result);
                } catch (e) {
                    await this.reporter.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${Err.short(e)}`);
                }
            }
        } finally {
            await this.reporter.dispose();
        }
    }

    protected async _logMessage(status: TestStatus, message?: string): Promise<void> {
        message = message || this.reporter.reporterName;
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
        const result: TestResult = {
            testId: testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: this.test.duration || 0,
                buildName: await this.buildInfoMgr.buildName() || 'unknown',
                buildNumber: await this.buildInfoMgr.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}