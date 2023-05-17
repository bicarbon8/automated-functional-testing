import { AftConfig, TestExecutionPolicyManager, ProcessingResult, pluginLoader } from "../../../src";
import { MockTestExecutionPolicyPlugin } from "./mock-policy-engine-plugin";

describe('TestExecutionPolicyManager', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })

    it('can load a specified ITestExecutionPolicyPlugin', async () => {
        let tcm: TestExecutionPolicyManager = new TestExecutionPolicyManager(new AftConfig({
            pluginNames: ['mock-policy-engine-plugin'],
            MockTestExecutionPolicyPluginConfig: {
                enabled: true
            }
        }));
        let actual = tcm.plugins;

        expect(actual).toBeDefined();
        expect(actual.length).withContext('plugins array length').toBe(1);
        expect(actual[0]).toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockTestExecutionPolicyPlugin').toEqual(MockTestExecutionPolicyPlugin.name);
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
            expect(plugins[0].constructor.name).toEqual(MockTestExecutionPolicyPlugin.name);

            const actual: ProcessingResult<boolean> = await tcm.shouldRun('C1234');

            expect(actual.result).toBe(true);
        })
    });
});