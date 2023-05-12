import { BrowserSessionGeneratorManager } from "../../src/sessions/browser-session-generator-manager";

describe('BrowserSessionGeneratorManager', () => {
    it('can load the BrowserStackBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            plugins: ['browserstack-browser-session-generator-plugin']
        });
        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('BrowserStackBrowserSessionGeneratorPlugin');
    });

    it('can load the SauceLabsBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            plugins: ['sauce-labs-browser-session-generator-plugin']
        });
        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('SauceLabsBrowserSessionGeneratorPlugin');
    });

    it('can load the SeleniumGridSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            plugins: ['selenium-grid-session-generator-plugin']
        });
        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('SeleniumGridSessionGeneratorPlugin');
    });
});