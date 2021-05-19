import { using, LoggingPluginManager, rand } from "aft-core";
import { TestPlatform } from "aft-ui";
import { BuildName, MobileAppFacet, SauceLabsMobileAppSessionGeneratorPlugin, SauceLabsMobileAppSessionGeneratorPluginOptions } from '../../../src';
import { RemoteOptions } from "webdriverio";
import { SauceLabsConfig } from "../../../src/sessions/sauce-labs/configuration/sauce-labs-config";

describe('SauceLabsMobileAppSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in SessionOptions', async () => {
        let plt: TestPlatform = new TestPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        let opts: SauceLabsMobileAppSessionGeneratorPluginOptions = {
            username: rand.getString(10, true, false, false, false),
            accessKey: rand.getString(12, true, true, false, false),
            platform: plt.toString(),
            tunnel: true,
            tunnelId: rand.getString(11, true),
            app: `app-${rand.getString(15)}`,
            logMgr: new LoggingPluginManager({logName:'can generate capabilities from the passed in SessionOptions'})
        }
        let session: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin(opts);

        let remOpts: RemoteOptions = await session.getRemoteOptions();

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
        expect(remOpts.capabilities['buildName']).toEqual(await BuildName.get());
        expect(remOpts.capabilities['name']).toEqual(await opts.logMgr.logName());
        expect(remOpts.capabilities['tunnelIdentifier']).toEqual(opts.tunnelId);
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
            platform: 'android_11_+_+_Google Pixel XL',
            _config: config
        });
        await using (await plugin.newSession(), async (session) => {
            let facet: MobileAppFacet = await session.getFacet(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(async (r) => await r.getText())).toEqual('Login');
        });
    }, 300000);
});