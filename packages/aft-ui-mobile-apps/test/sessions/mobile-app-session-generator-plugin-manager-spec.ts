import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorManager } from "../../src";

describe('MobileAppSessionGeneratorManager', () => {
    it('can load BrowserStackMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            pluginNames: ['browserstack-mobile-app-session-generator-plugin']
        });

        let plugin: MobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('BrowserStackMobileAppSessionGeneratorPlugin');
    });

    it('can load SauceLabsMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            pluginNames: ['sauce-labs-mobile-app-session-generator-plugin']
        });

        let plugin: MobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('SauceLabsMobileAppSessionGeneratorPlugin');
    });

    it('can load AppiumGridSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            pluginNames: ['appium-grid-session-generator-plugin']
        });

        let plugin: MobileAppSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('AppiumGridSessionGeneratorPlugin');
    });
});