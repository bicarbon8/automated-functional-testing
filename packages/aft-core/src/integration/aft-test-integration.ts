import { AftConfig, aftConfig } from "../configuration/aft-config";
import { convert } from "../helpers/convert";
import { Class, Func } from "../helpers/custom-types";
import { Err } from "../helpers/err";
import { rand } from "../helpers/rand";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { TestStatus } from "../plugins/reporting/test-status";
import { Verifier } from "../verification/verifier";
import { TitleParser } from "./title-parser";

export class AftTestIntegration {
    private readonly _aftCfg: AftConfig;
    private readonly _buildMgr: BuildInfoManager;
    private readonly _testCases: Array<string>;
    private _rep: Reporter;
    
    private readonly _testName: string;

    public readonly startTime: number;

    constructor(scope: any, aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._buildMgr = new BuildInfoManager(this._aftCfg);
        this._testCases = new Array<string>();
        if (typeof scope === 'string') {
            this._testName = scope;
        }
        this.startTime = Date.now();
    }

    get fullName(): string {
        return this._testName;
    }

    get aftCfg(): AftConfig {
        return this._aftCfg;
    }

    get reporter(): Reporter {
        if (!this._rep) {
            this._rep = new Reporter(this.fullName)
        }
        return this._rep;
    }

    get buildInfoMgr(): BuildInfoManager {
        return this._buildMgr;
    }

    get testCases(): Array<string> {
        if (this._testCases?.length === 0) {
            this._testCases.splice(0, 0, ...TitleParser.parseTestIds(this.fullName));
        }
        return this._testCases;
    }

    async pass(): Promise<void> {
        await this._logResult('passed');
    }

    async fail(message?: string): Promise<void> {
        const err: string = message ?? 'unknown error occurred';
        await this._logResult('failed', err);
    }

    async pending(message?: string): Promise<void> {
        message ??= 'test skipped';
        await this._logResult('skipped', message);
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
            .verify(assertion);
    }

    protected _getVerifier<T extends Verifier>(verifierType?: Class<T>): T {
        verifierType ??= Verifier as Class<T>;
        return new verifierType()
            .internals.usingReporter(this.reporter)
            .internals.usingAftConfig(this.aftCfg)
            .withDescription(this.fullName)
            .withTestIds(...this.testCases) as T;
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
            if (this.testCases.length) {
                this.testCases.forEach(async (testId: string) => {
                    if (message) {
                        await this._logMessage(status, `${testId} - ${message}`);
                    } else {
                        await this._logMessage(status, testId);
                    }
                });
            } else {
                await this._logMessage(status, message);
            }

            const results: TestResult[] = await this._generateResults(status, message, ...this.testCases);
            for (const result of results) {
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

    protected async _generateResults(status: TestStatus, logMessage: string, ...testIds: string[]): Promise<TestResult[]> {
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

    protected async _generateTestResult(status: TestStatus, logMessage: string, testId?: string): Promise<TestResult> {
        const result: TestResult = {
            testId: testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: convert.toElapsedMs(this.startTime),
                buildName: await this.buildInfoMgr.buildName() || 'unknown',
                buildNumber: await this.buildInfoMgr.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}
