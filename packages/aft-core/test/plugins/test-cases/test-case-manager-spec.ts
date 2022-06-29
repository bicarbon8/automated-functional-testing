import { TestCasePlugin, TestCaseManager } from "../../../src";

describe('TestCaseManager', () => {
    it('can load a specified TestCasePlugin', async () => {
        let tcm: TestCaseManager = new TestCaseManager({
            plugins: ['mock-test-case-plugin']
        });
        let actual = await tcm.plugins();

        expect(actual).toBeDefined();
        expect(actual.length).withContext('plugins array length').toBe(1);
        expect(actual[0]).toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockTestCasePlugin').toEqual('MockTestCasePlugin');
    });

    describe('shouldRun', () => {
        it('returns true if no plugins found or loaded', async () => {
            let tcm = new TestCaseManager();
            const plugins = await tcm.plugins();
            expect(plugins.length).toBe(0);

            const actual: boolean = await tcm.shouldRun('C1234');

            expect(actual).toBe(true);
        });
    });
});