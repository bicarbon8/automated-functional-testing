import { rand, TestStatus, TestCase, ITestCasePlugin, AftConfig, aftConfig } from "../../../src";

export class MockTestCasePluginConfig {
    enabled: boolean = false;
    testCases: Array<TestCase> = new Array<TestCase>();
}

export class MockTestCasePlugin implements ITestCasePlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "testcase" = 'testcase';
    public readonly enabled: boolean;
    private readonly _tests: Array<TestCase>;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockTestCasePluginConfig);
        this.enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._tests = cfg.testCases ?? new Array<TestCase>();
        }
    }
    async getTestCase(testId: string): Promise<TestCase> {
        if (this.enabled) {
            return this._tests.find(t => t.id === testId);
        }
        return null;
    }
    async findTestCases(searchCriteria: Partial<TestCase>): Promise<TestCase[]> {
        if (this.enabled) {
            let found = [...this._tests];
            if (searchCriteria.created != null) {
                found = found.filter(t => t.created === searchCriteria.created);
            }
            if (searchCriteria.description) {
                found = found.filter(t => t.description?.includes(searchCriteria.description));
            }
            if (searchCriteria.id) {
                found = found.filter(t => t.id === searchCriteria.id);
            }
            if (searchCriteria.result) {
                if (searchCriteria.result.status) {
                    found = found.filter(t => t.result?.status === searchCriteria.result.status);
                }
            }
            if (searchCriteria.status) {
                found = found.filter(t => t.status === searchCriteria.status);
            }
            if (searchCriteria.title) {
                found = found.filter(t => t.title?.includes(searchCriteria.title));
            }
            return found;
        }
        return null;
    }
    async shouldRun(testId: string): Promise<boolean> {
        if (this.enabled) {
            const test = await this.getTestCase(testId);
            if (test) {
                return test.result == null || test.result?.status === 'Retest';
            }
        }
        return true;
    }
}