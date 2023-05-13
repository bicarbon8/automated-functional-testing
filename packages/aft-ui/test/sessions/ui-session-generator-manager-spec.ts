import { AftConfig, pluginLoader, rand } from "aft-core";
import { UiSessionGeneratorManager } from "../../src";

describe('UiSessionGeneratorManager', () => {
    beforeEach(() => {
        pluginLoader.reset();
    });

    it('will get only specified plugin for use', async () => {
        const aftCfg = new AftConfig({
            pluginNames: [
                'fake-session-generator-plugin-throws',
                'fake-session-generator-plugin'
            ],
            sessionGeneratorName: 'fake-session-generator-plugin'
        });
        const manager = new UiSessionGeneratorManager(aftCfg);
        const byNameSpy = spyOn(pluginLoader, 'getPluginByName').and.callThrough();

        expect(manager).toBeDefined();
        expect(await manager.getSession()).not.toBeNull();
        expect(byNameSpy).toHaveBeenCalledTimes(1);
    });

    it('rejects with error if plugin unable to getSession', async () => {
        const aftCfg = new AftConfig({
            pluginNames: ['fake-session-generator-plugin-throws'],
            sessionGeneratorName: 'fake-session-generator-plugin-throws'
        });
        const manager = new UiSessionGeneratorManager(aftCfg);

        expect(manager).toBeDefined();
        expect(async () => await manager.getSession())
            .toThrowError(/(unable to generate UI session due to:).*/);
    });
});