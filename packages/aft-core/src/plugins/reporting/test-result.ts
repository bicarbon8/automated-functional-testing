import { TestStatus } from "./test-status";
import { JsonObject } from "../../helpers/custom-types";

export type TestResult = {
    testId?: string;
    testName?: string;
    resultMessage?: string;
    status: TestStatus;
    resultId: string;
    created: number;
    metadata?: JsonObject;
};
