import { ProcessingResult } from "../../helpers/custom-types";
import { Plugin } from "../plugin";

export class TestExecutionPolicyPlugin extends Plugin {
    shouldRun = (testId: string): Promise<ProcessingResult<boolean>> => null;
}