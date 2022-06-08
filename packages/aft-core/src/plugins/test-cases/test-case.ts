import { TestResult } from "./test-result";
import { TestStatus } from "./test-status";

export type TestCase = {
    id: string;
    created?: number;
    title?: string;
    description?: string;
    status: TestStatus;
    result?: TestResult;
};