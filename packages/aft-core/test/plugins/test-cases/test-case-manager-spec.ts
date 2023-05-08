import { AftConfig, ITestCasePlugin, TestCaseManager } from "../../../src";

describe('TestCaseManager', () => {
    it('can load a specified TestCasePlugin', async () => {
        let tcm: TestCaseManager = new TestCaseManager(new AftConfig({
            pluginNames: ['mock-test-case-plugin'],
            MockTestCasePluginConfig: {
                enabled: true
            }
        }));
        let actual = tcm.plugins;

        expect(actual).toBeDefined();
        expect(actual.length).withContext('plugins array length').toBe(1);
        expect(actual[0]).toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockTestCasePlugin').toEqual('MockTestCasePlugin');
    });

    describe('shouldRun', () => {
        it('returns true if no plugins found or loaded', async () => {
            let tcm = new TestCaseManager();
            const plugins = tcm.plugins;
            expect(plugins.length).toBe(0);

            const actual: boolean = await tcm.shouldRun('C1234');

            expect(actual).toBe(true);
        });

        it('returns true if no enabled plugins found', async () => {
            let tcm: TestCaseManager = new TestCaseManager(new AftConfig({
                pluginNames: ['mock-test-case-plugin']
            }));
            let plugins = tcm.plugins;
            expect(plugins.length).toBe(1);

            const actual: boolean = await tcm.shouldRun('C1234');

            expect(actual).toBe(true);
        })
    });
});