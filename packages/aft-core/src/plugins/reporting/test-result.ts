import { TestStatus } from "./test-status";
import { JsonObject } from "../../helpers/custom-types";

export type TestResult = {
    /**
     * an identifier to link this result back to an external
     * system such as TestRail
     * 
     * ex: `C1234`
     */
    testId?: string;
    /**
     * the full name of the test to which this result
     * originated
     */
    testName?: string;
    /**
     * a description of why the test has the result
     * that it does
     */
    resultMessage?: string;
    /**
     * an indicator of the final status of the test
     */
    status: TestStatus;
    /**
     * a UUID used to uniquely identify this result
     */
    resultId: string;
    /**
     * number of milliseconds since the epoc at the time
     * this result was created
     */
    created: number;
    /**
     * a JSON object containing any additional test or
     * system metadata such as:
     * - `duration: number`
     * - `environment: string`
     * - etc.
     */
    metadata?: JsonObject;
};
