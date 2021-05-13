import { using, LoggingPluginManager, rand } from "aft-core";
import { TestPlatform } from "aft-ui";
import { BrowserStackAppAutomateApi, BrowserStackConfig, BrowserStackMobileAppSessionGeneratorPlugin, BrowserStackMobileAppSessionGeneratorPluginOptions, BrowserStackMobileAppUploadCommand, BrowserStackMobileAppUploadResponse, MobileAppCommandResponse, MobileAppFacet, MobileAppSession } from "../../../src";
import { RemoteOptions } from "webdriverio";

describe('BrowserStackMobileAppSessionGeneratorPlugin', () => {
    it('can generate RemoteOptions from the passed in Options', async () => {
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
            logMgr: new LoggingPluginManager({logName: 'can generate RemoteOptions from the passed in Options'}),
            _config: cfg
        };
        let plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin(opts);

        let remOpts: RemoteOptions = await plugin.getRemoteOptions();

        expect(remOpts.capabilities['browserstack.user']).toEqual(await cfg.user());
        expect(remOpts.capabilities['browserstack.key']).toEqual(await cfg.key());
        expect(remOpts.capabilities['os']).toEqual(platform.os);
        expect(remOpts.capabilities['os_version']).toEqual(platform.osVersion);
        expect(remOpts.capabilities['browserName']).toEqual(platform.browser);
        expect(remOpts.capabilities['browser_version']).toEqual(platform.browserVersion);
        expect(remOpts.capabilities['device']).toEqual(platform.deviceName);
        expect(remOpts.capabilities['realMobile']).toEqual(true);
        expect(remOpts.capabilities['browserstack.local']).toEqual(true);
        expect(remOpts.capabilities['build']).toEqual(await cfg.buildName());
        expect(remOpts.capabilities['name']).toEqual(await opts.logMgr.logName());
    });

    it('can upload a mobile application using sendCommand', async () => {
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
        let mockApi: BrowserStackAppAutomateApi = jasmine.createSpyObj('BrowserStackAppAutomateApi', {
            "uploadApp": Promise.resolve({
                name: 'upload',
                app_url: `app_url-${rand.guid}`,
                custom_id: `custom_id-${rand.guid}`,
                shareable_id: `shareable_id-${rand.guid}`
            } as BrowserStackMobileAppUploadResponse)
        });
        let opts: BrowserStackMobileAppSessionGeneratorPluginOptions = {
            platform: platform.toString(),
            logMgr: new LoggingPluginManager({logName: 'can upload a mobile application using sendCommand'}),
            _config: cfg,
            _api: mockApi
        };
        let plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin(opts);
        let response: MobileAppCommandResponse = await plugin.sendCommand({
            commandType: 'upload',
            file: `file-${rand.guid}`,
            custom_id: `custom_id-${rand.guid}`
        } as BrowserStackMobileAppUploadCommand);

        expect(response).toBeDefined();
        let uploadResponse: BrowserStackMobileAppUploadResponse = response as BrowserStackMobileAppUploadResponse;
        expect(uploadResponse.app_url).toBeDefined();
        expect(uploadResponse.custom_id).toBeDefined();
        expect(uploadResponse.shareable_id).toBeDefined();
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
            platform: 'android_11_+_+_Google Pixel 5'
        });
        await using (await plugin.newSession(), async (session: MobileAppSession) => {
            let facet: MobileAppFacet = await session.getFacet(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(async (r) => await r.getText())).toEqual('Login');
        });
    }, 300000);
});