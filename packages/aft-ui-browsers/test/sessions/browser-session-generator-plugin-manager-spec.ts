import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorManager, BrowserStackBrowserSessionGeneratorPlugin, SauceLabsBrowserSessionGeneratorPlugin, SeleniumGridSessionGeneratorPlugin } from "../../src";

describe('BrowserSessionGeneratorPluginManager', () => {
    it('can load the BrowserStackBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            pluginNames: ['browserstack-browser-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: BrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('BrowserStackBrowserSessionGeneratorPlugin');
    });

    it('can load the SauceLabsBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            pluginNames: ['sauce-labs-browser-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: BrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('SauceLabsBrowserSessionGeneratorPlugin');
    });

    it('can load the SeleniumGridSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorManager = new BrowserSessionGeneratorManager({
            pluginNames: ['selenium-grid-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: BrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('SeleniumGridSessionGeneratorPlugin');
    });
});