import { using, AftLog, rand, buildinfo } from "aft-core";
import { UiPlatform } from "aft-ui";
import { BrowserStackAppAutomateApi, BrowserStackMobileAppSession, BrowserStackMobileAppSessionGeneratorPlugin, BrowserStackMobileAppSessionGeneratorPluginOptions, MobileAppFacet, MobileAppFacetOptions, MobileAppSession, UploadRequest, UploadResponse } from "../../../src";
import { RemoteOptions } from "webdriverio";

describe('BrowserStackMobileAppSessionGeneratorPlugin', () => {
    it('can generate RemoteOptions from the passed in Options', async () => {
        const platform: UiPlatform = new UiPlatform({
            os: `os-${rand.getString(10)}`,
            osVersion: `osVersion-${rand.getString(2, false, true)}`,
            browser: `browser-${rand.getString(15)}`,
            browserVersion: `browserVersion-${rand.getString(2, false, true)}`,
            deviceName: `deviceName-${rand.getString(22)}`
        });
        const opts: BrowserStackMobileAppSessionGeneratorPluginOptions = {
            user: `user-${rand.getString(10, true, false, false, false)}`,
            key: `key-${rand.getString(12, true, true, false, false)}`,
            local: true,
            localIdentifier: `localId-${rand.getString(15)}`,
            uiplatform: platform.toString(),
            remoteOptions: {
                capabilities: {"app": `app-${rand.getString(10)}`}
            },
            logMgr: new AftLog({logName: 'can generate RemoteOptions from the passed in Options'})
        };
        const plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin(opts);

        const remOpts: RemoteOptions = await plugin.generateRemoteOptions();

        expect(remOpts.user).toEqual(opts.user);
        expect(remOpts.key).toEqual(opts.key);
        expect(remOpts.capabilities['os']).toEqual(platform.os);
        expect(remOpts.capabilities['os_version']).toEqual(platform.osVersion);
        expect(remOpts.capabilities['browserName']).not.toBeDefined();
        expect(remOpts.capabilities['browser_version']).not.toBeDefined();
        expect(remOpts.capabilities['device']).toEqual(platform.deviceName);
        expect(remOpts.capabilities['realMobile']).toEqual(true);
        expect(remOpts.capabilities['browserstack.local']).toEqual(true);
        expect(remOpts.capabilities['browserstack.localIdentifier']).toEqual(opts.localIdentifier);
        expect(remOpts.capabilities['build']).toEqual(await buildinfo.buildName());
        expect(remOpts.capabilities['name']).toEqual(opts.logMgr.logName);
        expect(remOpts.capabilities['app']).toEqual(remOpts.capabilities['app']);
    });

    it('can upload a mobile application using sendCommand', async () => {
        const platform: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        const mockApi: BrowserStackAppAutomateApi = jasmine.createSpyObj('BrowserStackAppAutomateApi', {
            "uploadApp": Promise.resolve({
                name: 'upload',
                app_url: `app_url-${rand.guid}`,
                custom_id: `custom_id-${rand.guid}`,
                shareable_id: `shareable_id-${rand.guid}`
            } as UploadResponse)
        });
        const opts: BrowserStackMobileAppSessionGeneratorPluginOptions = {
            user: rand.getString(10, true, false, false, false),
            key: rand.getString(12, true, true, false, false),
            local: true,
            uiplatform: platform.toString(),
            logMgr: new AftLog({logName: 'can upload a mobile application using sendCommand'}),
            api: mockApi
        };
        const plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin(opts);
        const response: any = await plugin.sendCommand('upload', {
            file: `file-${rand.guid}`,
            custom_id: `custom_id-${rand.guid}`
        });

        expect(response).toBeDefined();
        let uploadResponse: UploadResponse = response as UploadResponse;
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
        const plugin: BrowserStackMobileAppSessionGeneratorPlugin = new BrowserStackMobileAppSessionGeneratorPlugin({
            user: '%browserstack_user%',
            key: '%browserstack_key%',
            uiplatform: 'android_11_+_+_Google Pixel 5'
        });
        await using (await plugin.newUiSession(), async (session: BrowserStackMobileAppSession) => {
            let facet = await session.getFacet<MobileAppFacet, MobileAppFacetOptions>(MobileAppFacet, {locator: 'button.radius'});

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        });
    }, 300000);
});