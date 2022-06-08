import { using, LogManager, rand, buildinfo } from "aft-core";
import { UiPlatform } from "aft-ui";
import { MobileAppFacet, MobileAppFacetOptions, SauceLabsMobileAppSessionGeneratorPlugin, SauceLabsMobileAppSessionGeneratorPluginOptions } from '../../../src';
import { RemoteOptions } from "webdriverio";
import { SauceLabsConfig } from "../../../src/sessions/sauce-labs/configuration/sauce-labs-config";

describe('SauceLabsMobileAppSessionGeneratorPlugin', () => {
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
            tunnel: true,
            tunnelId: rand.getString(11, true)
        });
        let opts: SauceLabsMobileAppSessionGeneratorPluginOptions = {
            config: config,
            uiplatform: plt.toString(),
            app: `app-${rand.getString(15)}`,
            logMgr: new LogManager({logName:'can generate capabilities from the passed in SessionOptions'})
        }
        let session: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin(opts);

        let remOpts: RemoteOptions = await session.getRemoteOptions();

        expect(remOpts.user).toEqual(await config.username());
        expect(remOpts.key).toEqual(await config.accessKey());
        expect(remOpts.capabilities['platformName']).toEqual(plt.os);
        expect(remOpts.capabilities['platformVersion']).toEqual(plt.osVersion);
        expect(remOpts.capabilities['browserName']).not.toBeDefined();
        expect(remOpts.capabilities['browserVersion']).not.toBeDefined();
        expect(remOpts.capabilities['deviceName']).toEqual(plt.deviceName);
        expect(remOpts.capabilities['app']).toEqual(opts.app);
        expect(remOpts.user).toEqual(await config.username());
        expect(remOpts.key).toEqual(await config.accessKey());
        expect(remOpts.capabilities['buildName']).toEqual(await buildinfo.get());
        expect(remOpts.capabilities['name']).toEqual(opts.logMgr.logName);
        expect(remOpts.capabilities['tunnelIdentifier']).toEqual(await config.tunnelId());
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
        let config: SauceLabsConfig = new SauceLabsConfig({
            username: 'fake-username',
            accessKey: 'fake-accesskey'
        });
        let plugin: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin({
            uiplatform: 'android_11_+_+_Google Pixel XL',
            config: config
        });
        await using (await plugin.newUiSession(), async (session) => {
            let facet = await session.getFacet<MobileAppFacet, MobileAppFacetOptions>(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        });
    }, 300000);
});