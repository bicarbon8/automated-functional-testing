import { using, LoggingPluginManager, rand } from "aft-core";
import { TestPlatform } from "aft-ui";
import { BuildName, MobileAppFacet, SauceLabsMobileAppSessionGeneratorPlugin, SauceLabsMobileAppSessionGeneratorPluginOptions } from '../../../src';
import { RemoteOptions } from 'webdriverio';

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
            accesskey: rand.getString(12, true, true, false, false),
            platform: plt.toString(),
            tunnel: true,
            tunnelId: rand.getString(11, true),
            _logMgr: new LoggingPluginManager({logName:'can generate capabilities from the passed in SessionOptions'})
        }
        let session: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin(opts);

        let remOpts: RemoteOptions = await session.getRemoteOptions();

        expect(remOpts.capabilities['platformName']).toEqual(plt.os);
        expect(remOpts.capabilities['platformVersion']).toEqual(plt.osVersion);
        expect(remOpts.capabilities['browserName']).toEqual(plt.browser);
        expect(remOpts.capabilities['browserVersion']).toEqual(plt.browserVersion);
        expect(remOpts.capabilities['deviceName']).toEqual(plt.deviceName);
        expect(remOpts.user).toEqual(opts.username);
        expect(remOpts.key).toEqual(opts.accesskey);
        expect(remOpts.capabilities['buildName']).toEqual(await BuildName.get());
        expect(remOpts.capabilities['name']).toEqual(await opts._logMgr.logName());
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
        let plugin: SauceLabsMobileAppSessionGeneratorPlugin = new SauceLabsMobileAppSessionGeneratorPlugin({
            username: 'fake-username',
            accesskey: 'fake-accesskey',
            platform: 'windows_10_chrome'
        });
        await using (await plugin.newSession(), async (session) => {
            let facet: MobileAppFacet = await session.getFacet(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then((r) => r.getText())).toEqual('Login');
        });
    }, 300000);
});