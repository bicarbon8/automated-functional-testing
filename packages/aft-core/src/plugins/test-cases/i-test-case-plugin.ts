import { IPlugin } from "../i-plugin";
import { TestCase } from "./test-case";

export interface ITestCasePlugin extends IPlugin {
    readonly pluginType: 'testcase';
    getTestCase(testId: string): Promise<TestCase>;
    findTestCases(searchCriteria: Partial<TestCase>): Promise<TestCase[]>;
    shouldRun(testId: string): Promise<boolean>;
}