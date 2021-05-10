import { AbstractMobileAppSessionGeneratorPlugin, AppiumGridSessionGeneratorPlugin, BrowserStackMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginManager, SauceLabsMobileAppSessionGeneratorPlugin } from "../../src";

describe('MobileAppSessionGeneratorPluginManager', () => {
    it('can load BrowserStackMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({
            pluginNames: ['browserstack-mobile-app-session-generator-plugin'],
            searchDir: './dist/'
        });

        let plugin: AbstractMobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof BrowserStackMobileAppSessionGeneratorPlugin).toBeTrue();
    });

    it('can load SauceLabsMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({
            pluginNames: ['sauce-labs-mobile-app-session-generator-plugin'],
            searchDir: './dist/'
        });

        let plugin: AbstractMobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof SauceLabsMobileAppSessionGeneratorPlugin).toBeTrue();
    });

    it('can load AppiumGridSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorPluginManager = new MobileAppSessionGeneratorPluginManager({
            pluginNames: ['appium-grid-session-generator-plugin'],
            searchDir: './dist/'
        });

        let plugin: AbstractMobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof AppiumGridSessionGeneratorPlugin).toBeTrue();
    });
});