import { Plugin } from "../plugin";
import { TestResult } from "./test-result";

export class ResultsPlugin extends Plugin {
    submitResult = (result: TestResult): Promise<void> => null;
}