import { AftConfig, TestExecutionPolicyManager, ProcessingResult, pluginLoader } from "../../../src";
import { MockPolicyEnginePlugin } from "./mock-policy-engine-plugin";

describe('PolicyEngineManager', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })

    it('can load a specified IPolicyEnginePlugin', async () => {
        let tcm: TestExecutionPolicyManager = new TestExecutionPolicyManager(new AftConfig({
            pluginNames: ['mock-policy-engine-plugin'],
            MockTestCasePluginConfig: {
                enabled: true
            }
        }));
        let actual = tcm.plugins;

        expect(actual).toBeDefined();
        expect(actual.length).withContext('plugins array length').toBe(1);
        expect(actual[0]).toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockPolicyEnginePlugin').toEqual(MockPolicyEnginePlugin.name);
    });

    describe('shouldRun', () => {
        it('returns true if no plugins found or loaded', async () => {
            let tcm = new TestExecutionPolicyManager();
            const plugins = tcm.plugins;
            expect(plugins.length).toBe(0);

            const actual: ProcessingResult<boolean> = await tcm.shouldRun('C1234');

            expect(actual.result).toBe(true);
        });

        it('returns true if no enabled plugins found', async () => {
            pluginLoader.reset();
            let tcm: TestExecutionPolicyManager = new TestExecutionPolicyManager(new AftConfig({
                pluginNames: ['mock-policy-engine-plugin']
            }));
            let plugins = tcm.plugins;
            expect(plugins.length).toBe(1);
            expect(plugins[0].constructor.name).toEqual(MockPolicyEnginePlugin.name);

            const actual: ProcessingResult<boolean> = await tcm.shouldRun('C1234');

            expect(actual.result).toBe(true);
        })
    });
});