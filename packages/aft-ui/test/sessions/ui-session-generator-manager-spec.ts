import { pluginloader, rand } from "aft-core";
import { UiPlatform } from "../../src";
import { FakeSessionGeneratorManager, FakeSessionGeneratorManagerOptions } from "./fake-session-generator-manager";

describe('UiSessionGeneratorManager', () => {
    beforeEach(() => {
        pluginloader.clear();
    });

    it('can be extended by a class instance', async () => {
        const config = {
            logName: rand.getString(25),
            plugins: ['fake-session-generator-plugin']
        };
        const manager = new FakeSessionGeneratorManager(config);

        expect(manager).toBeDefined();
        expect(await manager.logMgr().then((l) => l.logName)).toEqual(config.logName);
        expect(await manager.first().then((f) => f.constructor.name)).toEqual('FakeSessionGeneratorPlugin');
        expect(await manager.newUiSession()).toBeDefined();
    });

    it('can handle a defective plugin', async () => {
        const config = {
            plugins: ['fake-session-generator-plugin-throws']
        } as FakeSessionGeneratorManagerOptions;
        const manager = new FakeSessionGeneratorManager(config);

        expect(manager).toBeDefined();
        expect(await manager.logMgr().then((l) => l.logName)).toEqual(manager.constructor.name);
        expect(await manager.first().then((f) => f.constructor.name)).toEqual('FakeSessionGeneratorPluginThrows');
        expect(await manager.newUiSession()).toBeNull();
    });

    it('sets the uiplatform if the plugin options does not already set it', async () => {
        const plt = UiPlatform.parse('android_12_chrome_79_Google Pixel XL');
        const manager = new FakeSessionGeneratorManager({
            uiplatform: plt.toString(),
            plugins: ['fake-session-generator-plugin']
        });

        const plugin = await manager.first();
        expect(plugin.uiplatform.toString()).toEqual(plt.toString());
    });

    it('does not set the uiplatform if the plugin options set it', async () => {
        const plt = UiPlatform.parse('android_12_chrome_79_Google Pixel XL');
        const expected = 'windows_10_firefox_88_+';
        const manager = new FakeSessionGeneratorManager({
            uiplatform: plt.toString(),
            plugins: [{
                name: 'fake-session-generator-plugin',
                options: {
                    uiplatform: expected
                }
            }]
        });

        const plugin = await manager.first();
        expect(plugin.uiplatform.toString()).toEqual(expected);
    });
});