import { using, AftLog, rand, buildinfo } from "aft-core";
import { UiPlatform } from "aft-ui";
import { MobileAppFacet, MobileAppFacetOptions, SauceLabsMobileAppSessionGeneratorPlugin, SauceLabsMobileAppSessionGeneratorPluginOptions } from '../../../src';
import { RemoteOptions } from "webdriverio";

describe('SauceLabsMobileAppSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in SessionOptions', async () => {
        const plt: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        const opts: SauceLabsMobileAppSessionGeneratorPluginOptions = {
            username: rand.getString(10, true, false, false, false),
            accessKey: rand.getString(12, true, true, false, false),
            tunnel: true,
            tunnelIdentifier: rand.getString(11, true),
            uiplatform: plt.toString(),
            app: `app-${rand.getString(15)}`,
            logMgr: new AftLog({logName:'can generate capabilities from the passed in SessionOptions'})
        }
        const session: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin(opts);

        const remOpts: RemoteOptions = await session.generateRemoteOptions();

        expect(remOpts.user).toEqual(opts.username);
        expect(remOpts.key).toEqual(opts.accessKey);
        expect(remOpts.capabilities['platformName']).toEqual(plt.os);
        expect(remOpts.capabilities['platformVersion']).toEqual(plt.osVersion);
        expect(remOpts.capabilities['browserName']).not.toBeDefined();
        expect(remOpts.capabilities['browserVersion']).not.toBeDefined();
        expect(remOpts.capabilities['deviceName']).toEqual(plt.deviceName);
        expect(remOpts.capabilities['app']).toEqual(opts.app);
        expect(remOpts.user).toEqual(opts.username);
        expect(remOpts.key).toEqual(opts.accessKey);
        expect(remOpts.capabilities['buildName']).toEqual(await buildinfo.get());
        expect(remOpts.capabilities['name']).toEqual(opts.logMgr.logName);
        expect(remOpts.capabilities['tunnelIdentifier']).toEqual(opts.tunnelIdentifier);
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
        const plugin: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin({
            uiplatform: 'android_11_+_+_Google Pixel XL',
            username: '%saucelabs_username%',
            accessKey: '%saucelabs_accessKey%'
        });
        await using (await plugin.newUiSession(), async (session) => {
            let facet = await session.getFacet<MobileAppFacet, MobileAppFacetOptions>(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        });
    }, 300000);
});