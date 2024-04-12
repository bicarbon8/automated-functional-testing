import { TestResult } from "aft-core";

export type HtmlTestResult = TestResult & {
    logs: string[];
};
