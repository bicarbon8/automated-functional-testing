import { MobileAppSessionGeneratorManager } from "../../src/sessions/mobile-app-session-generator-manager";

describe('MobileAppSessionGeneratorManager', () => {
    it('can load BrowserStackMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            plugins: ['browserstack-mobile-app-session-generator-plugin']
        });

        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('BrowserStackMobileAppSessionGeneratorPlugin');
    });

    it('can load SauceLabsMobileAppSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            plugins: ['sauce-labs-mobile-app-session-generator-plugin']
        });

        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('SauceLabsMobileAppSessionGeneratorPlugin');
    });

    it('can load AppiumGridSessionGeneratorPlugin', async () => {
        let mgr: MobileAppSessionGeneratorManager = new MobileAppSessionGeneratorManager({
            plugins: ['appium-grid-session-generator-plugin']
        });

        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).withContext('plugin should be instance type expected').toEqual('AppiumGridSessionGeneratorPlugin');
    });
});