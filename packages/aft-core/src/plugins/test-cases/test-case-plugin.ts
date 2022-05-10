import { Plugin, PluginOptions } from "../plugin";
import { ProcessingResult } from "../../helpers/processing-result";
import { ITestCase } from "./itest-case";

export interface TestCasePluginOptions extends PluginOptions {
    
}

export abstract class TestCasePlugin extends Plugin<TestCasePluginOptions> {
    abstract getTestCase(testId: string): Promise<ITestCase>;
    abstract findTestCases(searchTerm: string): Promise<ITestCase[]>;
    abstract shouldRun(testId: string): Promise<ProcessingResult>;
}