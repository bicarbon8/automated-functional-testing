import { rand, TestStatus, TestCase, ITestCasePlugin, AftConfig, aftConfig } from "../../../src";

export class MockTestCasePluginConfig {
    public enabled: boolean;
}

export class MockTestCasePlugin implements ITestCasePlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "testcase" = 'testcase';
    public readonly enabled: boolean;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockTestCasePluginConfig);
        this.enabled = cfg.enabled;
    }
    async getTestCase(testId: string): Promise<TestCase> {
        if (this.enabled) {
            return {
                id: testId,
                title: rand.getString(8),
                description: rand.getString(100),
                status: rand.getFrom<TestStatus>('Blocked', 'Failed', 'Passed', 'Retest', 'Skipped', 'Untested')
            } as TestCase;
        }
        return null;
    }
    async findTestCases(searchCriteria: Partial<TestCase>): Promise<TestCase[]> {
        if (this.enabled) {
            let cases: TestCase[] = [];
            let resultCount: number = rand.getInt(1, 5);
            for (var i=0; i<resultCount; i++) {
                let c: TestCase = {
                    id: 'C' + rand.getInt(100, 999),
                    title: rand.getString(8),
                    description: rand.getString(100),
                    status: rand.getFrom<TestStatus>('Blocked', 'Failed', 'Passed', 'Retest', 'Skipped', 'Untested')
                } as TestCase;
                cases.push(c);
            }
            return cases;
        }
        return null;
    }
    async shouldRun(testId: string): Promise<boolean> {
        if (this.enabled) {
            switch(testId) {
                case 'C1234':
                    let c1: TestCase = await this.getTestCase(testId);
                    return false;
                case 'C2345':
                    let c2: TestCase = await this.getTestCase(testId);
                    return true;
                default:
                    let c3: TestCase = await this.getTestCase(testId);
                    return rand.boolean;
            }
        }
        return true;
    }
}