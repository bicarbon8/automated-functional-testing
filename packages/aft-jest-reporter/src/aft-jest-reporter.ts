import { AftTest } from "./aft-test";
import { AggregatedResult, Config, Reporter, ReporterContext, TestCaseResult, TestContext, TestResult } from "@jest/reporters";
import { ReporterOnStartOptions } from "@jest/reporters";
import { Test } from "@jest/reporters";
import { FileSystemMap } from "aft-core";

export default class AftJestReporter implements Reporter {
    private readonly _globalConfig: Config.GlobalConfig;
    private readonly _options: Record<string, any>;
    private readonly _context: ReporterContext;
    private readonly _async2Sync: Array<Promise<any>>;
    private readonly _testNames: FileSystemMap<string, any>;

    constructor(globalConfig: Config.GlobalConfig, reporterOptions: Record<string, any>, reporterContext: ReporterContext) {
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
        this._async2Sync = new Array<Promise<void>>;
        this._testNames = new FileSystemMap<string, any>(this.constructor.name);
    }

    onTestResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult): Promise<void> | void {
        const foo = 'bar';
    }
    onTestFileResult(test: Test, testResult: TestResult, aggregatedResult: AggregatedResult): Promise<void> | void {
        const foo = 'bar';
    }
    onTestCaseResult(test: Test, testCaseResult: TestCaseResult): Promise<void> | void {
        const t = new AftTest({testCaseResult});
        switch (testCaseResult.status) {
            case "skipped":
                t.skipped();
                t.dispose();
                break;
            case "failed":
                t.fail();
                t.dispose();
                break;
            case "passed":
                t.pass();
                t.dispose();
                break;
        }
    }
    onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): Promise<void> | void {
        const foo = 'bar';
    }
    onTestStart(test: Test): Promise<void> | void {
        const t: AftTest = new AftTest({test});
        this._testNames.set(t.fullName, true);
    }
    onTestFileStart(test: Test): Promise<void> | void {
        const t: AftTest = new AftTest({test});
        this._testNames.set(t.fullName, true);
    }
    onRunComplete(testContexts: Set<TestContext>, results: AggregatedResult): Promise<void> | void {
        const foo = 'bar';
    }
    getLastError(): Error | void {
        const foo = 'bar';
    }
}