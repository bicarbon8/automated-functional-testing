import { Plugin, PluginOptions } from "../plugin";
import { TestCase } from "./test-case";

export type TestCasePluginOptions = PluginOptions;

export abstract class TestCasePlugin<T extends TestCasePluginOptions> extends Plugin<T> {
    abstract getTestCase(testId: string): Promise<TestCase>;
    abstract findTestCases(searchTerm: string): Promise<TestCase[]>;
    abstract shouldRun(testId: string): Promise<boolean>;
}