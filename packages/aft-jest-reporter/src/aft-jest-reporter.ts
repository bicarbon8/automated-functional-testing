import { AftJestTest } from "./aft-jest-test";
import { AggregatedResult, Config, Reporter, ReporterContext, TestCaseResult, TestContext } from "@jest/reporters";
import { ReporterOnStartOptions } from "@jest/reporters";
import { Test } from "@jest/reporters";
import { FileSystemMap } from "aft-core";

export default class AftJestReporter implements Reporter {
    private readonly _globalConfig: Config.GlobalConfig;
    private readonly _options: Record<string, any>;
    private readonly _context: ReporterContext;

    constructor(globalConfig: Config.GlobalConfig, reporterOptions: Record<string, any>, reporterContext: ReporterContext) {
        this._globalConfig = globalConfig;
        this._options = reporterOptions;
        this._context = reporterContext;
    }

    // start: required Reporter functions
    onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): Promise<void> | void { // eslint-disable-line no-unused-vars
        // clear all previously cached test results
        FileSystemMap.removeCacheFile(AftJestTest.name);
        /**
         * NOTE Jest does not provide the ability to programmatically skip a test
         * nor would the Reporter be allowed to perform this action so we
         * must use the `AftJestTest.shouldRun` in the beginning of a `test` function
         */
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
        const t = new AftJestTest(testCaseResult);
        if (t.results.length === 0) {
            // aftJestTest was NOT used in test
            switch (testCaseResult.status) {
                case "skipped":
                    return t.skipped(testCaseResult.failureMessages?.join('\n'))
                        .catch((err) => t.reporter.warn(err));
                case "failed":
                    return t.fail(testCaseResult.failureMessages?.join('\n'))
                        .catch((err) => t.reporter.warn(err));
                case "passed":
                    return t.pass()
                        .catch((err) => t.reporter.warn(err));
            }
        }
    }
    // end: optional Reporter functions
}
