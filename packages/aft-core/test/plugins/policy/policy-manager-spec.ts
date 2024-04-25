import { AftConfig, PolicyManager, ProcessingResult, pluginLoader } from "../../../src";
import { MockPolicyPlugin } from "./mock-policy-plugin";

describe('PolicyManager', () => {
    beforeEach(() => {
        pluginLoader.reset();
    })

    afterEach(() => {
        pluginLoader.reset();
    })

    it('can load a specified PolicyPlugin', async () => {
        let tcm: PolicyManager = new PolicyManager(new AftConfig({
            plugins: ['mock-policy-plugin'],
            MockPolicyPluginConfig: {
                enabled: true
            }
        }));
        let actual = tcm.plugins;

        expect(actual).toBeDefined();
        expect(actual.length).withContext('plugins array length').toBe(1);
        expect(actual[0]).toBeDefined();
        expect(actual[0].constructor.name).withContext('plugin should be instance of MockPolicyPlugin').toEqual(MockPolicyPlugin.name);
    });

    describe('shouldRun', () => {
        it('returns true if no plugins found or loaded', async () => {
            let tcm = new PolicyManager();
            const plugins = tcm.plugins;
            expect(plugins.length).toBe(0);

            const actual: ProcessingResult<boolean> = await tcm.shouldRun('C1234');

            expect(actual.result).toBe(true);
        });

        it('returns true if no enabled plugins found', async () => {
            pluginLoader.reset();
            let tcm: PolicyManager = new PolicyManager(new AftConfig({
                plugins: ['mock-policy-plugin'],
                MockPolicyPluginConfig: {
                    enabled: false
                }
            }));
            let plugins = tcm.plugins;
            expect(plugins.length).toBe(0);

            const actual: ProcessingResult<boolean> = await tcm.shouldRun('C1234');

            expect(actual.result).toBe(true);
        })
    });
});