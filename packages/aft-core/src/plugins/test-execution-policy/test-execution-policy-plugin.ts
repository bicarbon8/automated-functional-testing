import { ProcessingResult } from "../../helpers/custom-types";
import { Plugin } from "../plugin"; // eslint-disable-line no-redeclare

export class TestExecutionPolicyPlugin extends Plugin {
    shouldRun = (testId: string): Promise<ProcessingResult<boolean>> => null; // eslint-disable-line no-unused-vars
}