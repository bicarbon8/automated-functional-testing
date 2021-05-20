import { AbstractBrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginManager, BrowserStackBrowserSessionGeneratorPlugin, SauceLabsBrowserSessionGeneratorPlugin, SeleniumGridSessionGeneratorPlugin } from "../../src";

describe('BrowserSessionGeneratorPluginManager', () => {
    it('can load the BrowserStackBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager({
            pluginNames: ['browserstack-browser-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: AbstractBrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof BrowserStackBrowserSessionGeneratorPlugin).toBeTrue();
    });

    it('can load the SauceLabsBrowserSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager({
            pluginNames: ['sauce-labs-browser-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: AbstractBrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof SauceLabsBrowserSessionGeneratorPlugin).toBeTrue();
    });

    it('can load the SeleniumGridSessionGeneratorPlugin', async () => {
        let mgr: BrowserSessionGeneratorPluginManager = new BrowserSessionGeneratorPluginManager({
            pluginNames: ['selenium-grid-session-generator-plugin'],
            searchDir: './dist/'
        });
        let plugin: AbstractBrowserSessionGeneratorPlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof SeleniumGridSessionGeneratorPlugin).toBeTrue();
    });
});