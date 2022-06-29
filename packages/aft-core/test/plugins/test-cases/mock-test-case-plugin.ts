import { rand, TestStatus, TestCase, TestCasePlugin, TestCasePluginOptions } from "../../../src";

export type MockTestCasePluginOptions = TestCasePluginOptions;

export class MockTestCasePlugin extends TestCasePlugin<MockTestCasePluginOptions> {
    override async getTestCase(testId: string): Promise<TestCase> {
        return {
            id: testId,
            title: rand.getString(8),
            description: rand.getString(100),
            status: rand.getFrom<TestStatus>('Blocked', 'Failed', 'Passed', 'Retest', 'Skipped', 'Untested')
        } as TestCase;
    }
    override async findTestCases(searchTerm: string): Promise<TestCase[]> {
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
    override async shouldRun(testId: string): Promise<boolean> {
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
}