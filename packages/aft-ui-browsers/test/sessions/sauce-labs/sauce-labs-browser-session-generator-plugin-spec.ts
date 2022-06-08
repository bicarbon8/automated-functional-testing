import { By, Capabilities } from 'selenium-webdriver';
import { using, LogManager, rand, buildinfo } from "aft-core";
import { UiPlatform } from "aft-ui";
import { BrowserFacet, BrowserFacetOptions, SauceLabsBrowserSessionGeneratorPlugin, SauceLabsBrowserSessionGeneratorPluginOptions, SauceLabsConfig } from '../../../src';

describe('SauceLabsBrowserSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in SessionOptions', async () => {
        let plt: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        const config: SauceLabsConfig = new SauceLabsConfig({
            username: rand.getString(10, true, false, false, false),
            accessKey: rand.getString(12, true, true, false, false),
            resolution: rand.getString(4, false, true) + 'x' + rand.getString(4, false, true),
            tunnel: true,
            tunnelId: rand.getString(11, true)
        });
        let opts: SauceLabsBrowserSessionGeneratorPluginOptions = {
            config: config,
            uiplatform: plt.toString(),
            logMgr: new LogManager({logName:'can generate capabilities from the passed in SessionOptions'})
        }
        let session: SauceLabsBrowserSessionGeneratorPlugin = new SauceLabsBrowserSessionGeneratorPlugin(opts);

        let caps: Capabilities = await session.getCapabilities();

        expect(caps.get('platformName')).toEqual(plt.os);
        expect(caps.get('platformVersion')).toEqual(plt.osVersion);
        expect(caps.get('browserName')).toEqual(plt.browser);
        expect(caps.get('browserVersion')).toEqual(plt.browserVersion);
        expect(caps.get('deviceName')).toEqual(plt.deviceName);
        let sauceOpts: object = caps.get('sauce:options');
        expect(sauceOpts).toBeDefined();
        expect(sauceOpts['build']).toEqual(await buildinfo.get());
        expect(sauceOpts['name']).toEqual(opts.logMgr.logName);
        expect(sauceOpts['screenResolution']).toEqual(await config.resolution());
        expect(sauceOpts['tunnelIdentifier']).toEqual(await config.tunnelId());
    });
    
    /**
     * WARNING: this test will attempt to create an actual session on Sauce Labs
     * it should only be used for local debugging.
     * NOTE: you will need to set a value for the following via SauceLabsConfig
     * or as environment variables:
     * - sauce_username
     * - sauce_access_key
     */
    xit('can create a session in Sauce Labs', async () => {
        const config: SauceLabsConfig = new SauceLabsConfig({
            username: 'fake-username',
            accessKey: 'fake-accesskey',
        });
        let plugin: SauceLabsBrowserSessionGeneratorPlugin = new SauceLabsBrowserSessionGeneratorPlugin({
            uiplatform: 'windows_10_chrome',
            config: config
        });
        await using (await plugin.newUiSession(), async (session) => {
            let expectedUrl: string = 'https://the-internet.herokuapp.com/login';
            await session.goTo(expectedUrl);

            let actualUrl: string = await session.driver.getCurrentUrl();

            expect(actualUrl).toEqual(expectedUrl);

            let facet: BrowserFacet = await session.getFacet<BrowserFacet, BrowserFacetOptions>(BrowserFacet, {locator: By.css('button.radius')});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        });
    }, 300000);
});