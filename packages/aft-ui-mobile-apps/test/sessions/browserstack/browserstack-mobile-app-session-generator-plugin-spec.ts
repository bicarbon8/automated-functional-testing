import { using, LoggingPluginManager, rand } from "aft-core";
import { TestPlatform } from "aft-ui";
import { BrowserStackMobileAppSessionGeneratorPlugin, BrowserStackMobileAppSessionGeneratorPluginOptions, BuildName, MobileAppFacet, MobileAppSession } from "../../../src";
import { RemoteOptions } from 'webdriverio';
import { BrowserStackConfig } from "../../../src/sessions/browserstack/configuration/browserstack-config";

describe('BrowserStackMobileAppSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in SessionOptions', async () => {
        let platform: TestPlatform = new TestPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        let cfg: BrowserStackConfig = new BrowserStackConfig({
            user: rand.getString(10, true, false, false, false),
            key: rand.getString(12, true, true, false, false),
            local: true
        });
        let opts: BrowserStackMobileAppSessionGeneratorPluginOptions = {
            platform: platform.toString(),
            _logMgr: new LoggingPluginManager({logName: 'can generate capabilities from the passed in SessionOptions'}),
            _config: cfg
        };
        let session: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin(opts);

        let remOpts: RemoteOptions = await session.getRemoteOptions();

        expect(remOpts.capabilities['browserstack.user']).toEqual(cfg.user);
        expect(remOpts.capabilities['browserstack.key']).toEqual(cfg.key);
        expect(remOpts.capabilities['os']).toEqual(platform.os);
        expect(remOpts.capabilities['os_version']).toEqual(platform.osVersion);
        expect(remOpts.capabilities['browserName']).toEqual(platform.browser);
        expect(remOpts.capabilities['browser_version']).toEqual(platform.browserVersion);
        expect(remOpts.capabilities['device']).toEqual(platform.deviceName);
        expect(remOpts.capabilities['realMobile']).toEqual(true);
        expect(remOpts.capabilities['browserstack.local']).toEqual(true);
        expect(remOpts.capabilities['build']).toEqual(await BuildName.get());
        expect(remOpts.capabilities['name']).toEqual(await opts._logMgr.logName());
    });
    
    /**
     * WARNING: this test will attempt to create an actual session on BrowserStack
     * it should only be used for local debugging.
     * NOTE: you will need to set a value for the following via BrowserStackConfig
     * or as environment variables:
     * - browserstack_user
     * - browserstack_accesskey
     */
    xit('can create a session in BrowserStack', async () => {
        let cfg: BrowserStackConfig = new BrowserStackConfig({
            user: 'your-user',
            key: 'your-key'
        });
        let plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin({
            _config: cfg,
            platform: 'windows_10_chrome'
        });
        await using (await plugin.newSession(), async (session: MobileAppSession) => {
            let facet: MobileAppFacet = await session.getFacet(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then((r) => r.getText())).toEqual('Login');
        });
    }, 300000);
});