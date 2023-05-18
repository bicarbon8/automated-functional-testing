import { AftConfig, pluginLoader } from "aft-core";
import { UiSessionGeneratorManager, UiSessionGeneratorPlugin } from "../../src";
import { FakeSessionGeneratorPlugin } from "./fake-session-generator-plugin";

const consolelog = console.log;

describe('UiSessionGeneratorManager', () => {
    beforeAll(() => {
        console.log = (...args: any[]) => null;
    });

    beforeEach(() => {
        pluginLoader.reset();
    });

    afterAll(() => {
        console.log = consolelog;
    });

    it('will get only specified plugin for use', async () => {
        const aftCfg = new AftConfig({
            pluginNames: [
                'fake-session-generator-plugin-throws',
                'fake-session-generator-plugin'
            ],
            UiSessionConfig: {
                generatorName: 'fake-session-generator-plugin'
            }
        });
        const manager = new UiSessionGeneratorManager(aftCfg);

        expect(manager).toBeDefined();
        expect(manager.plugins.length).toBe(2);
        const enabled: Array<UiSessionGeneratorPlugin> = manager.plugins.filter(p => p.enabled);
        expect(enabled.length).toBe(1);
        expect(enabled[0].constructor.name).toEqual(FakeSessionGeneratorPlugin.name);
        expect(await manager.getSession()).not.toBeNull();
    });

    it('rejects with error if plugin unable to getSession', async () => {
        const aftCfg = new AftConfig({
            pluginNames: ['fake-session-generator-plugin-throws'],
            UiSessionConfig: {
                generatorName: 'fake-session-generator-plugin-throws'
            }
        });
        const manager = new UiSessionGeneratorManager(aftCfg);

        expect(manager).toBeDefined();
        await manager.getSession().catch((err) => {
            expect(err).toMatch(/.*(unable to generate UI session due to:).*/);
        });
    });
});