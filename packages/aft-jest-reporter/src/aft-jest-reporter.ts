import { AftTest } from "./aft-test";
import { AggregatedResult, Config, Reporter, ReporterContext, TestCaseResult, TestContext } from "@jest/reporters";
import { ReporterOnStartOptions } from "@jest/reporters";
import { Test } from "@jest/reporters";
import { FileSystemMap } from "aft-core";

export default class AftJestReporter implements Reporter {
    private readonly _globalConfig: Config.GlobalConfig;
    private readonly _options: Record<string, any>;
    private readonly _context: ReporterContext;
    private readonly _fsMap: FileSystemMap<string, any>;

    constructor(globalConfig: Config.GlobalConfig, reporterOptions: Record<string, any>, reporterContext: ReporterContext) {
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
        this._fsMap = new FileSystemMap<string, any>(AftJestReporter.name);
    }

    // start: required Reporter functions
    onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): Promise<void> | void { // eslint-disable-line no-unused-vars
        /* do nothing */
    }
    onRunComplete(testContexts: Set<TestContext>, results: AggregatedResult): Promise<void> | void { // eslint-disable-line no-unused-vars
        /* do nothing */
    }
    getLastError(): Error | void {
        /* do nothing */
    }
    // end: required Reporter functions

    // start: optional Reporter functions
    onTestCaseResult(test: Test, testCaseResult: TestCaseResult): Promise<void> | void {
        const partialResult = this._fsMap.get(testCaseResult.fullName);
        if (partialResult) {
            // AFT was used in test so overwrite result
            testCaseResult = {...testCaseResult, ...partialResult};
        } else {
            // AFT was NOT used in test
            const t = new AftTest(testCaseResult);
            switch (testCaseResult.status) {
                case "skipped":
                    return t.skipped(testCaseResult.failureMessages?.join('\n'))
                        .then(() => t.dispose())
                        .catch((err) => t.reporter.warn(err));
                case "failed":
                    return t.fail(testCaseResult.failureMessages?.join('\n'))
                        .then(() => t.dispose())
                        .catch((err) => t.reporter.warn(err));
                case "passed":
                    return t.pass()
                        .then(() => t.dispose())
                        .catch((err) => t.reporter.warn(err));
            }
        }
    }
    // end: optional Reporter functions
}