import { TestStatus } from "./test-status";
import { Defect } from "../defects/defect";
import { JsonObject } from "../../helpers/custom-types";

export type TestResult = {
    testId?: string;
    resultMessage?: string;
    status: TestStatus;
    resultId: string;
    created: number;
    defects?: Defect[];
    metadata?: JsonObject;
};