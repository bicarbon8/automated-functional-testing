import { By, Capabilities } from 'selenium-webdriver';
import { using, AftLog, rand, buildinfo } from "aft-core";
import { UiPlatform } from "aft-ui";
import { BrowserStackBrowserSessionGeneratorPlugin, BrowserStackBrowserSessionGeneratorPluginOptions, BrowserFacet, BrowserSession, BrowserFacetOptions, BrowserStackBrowserSessionOptions } from "../../../src";

describe('BrowserStackBrowserSessionGeneratorPlugin', () => {
    it('can generate capabilities from the BrowserStackBrowserSessionGeneratorPluginOptions', async () => {
        const platform: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        const opts: BrowserStackBrowserSessionGeneratorPluginOptions = {
            user: rand.getString(10, true, false, false, false),
            key: rand.getString(12, true, true, false, false),
            resolution: rand.getString(4, false, true) + 'x' + rand.getString(4, false, true),
            local: true,
            uiplatform: platform.toString(),
            logMgr: new AftLog({logName: 'can generate capabilities from the BrowserStackBrowserSessionGeneratorPluginOptions'})
        };
        const session: BrowserStackBrowserSessionGeneratorPlugin = new BrowserStackBrowserSessionGeneratorPlugin(opts);

        const capabilities: Capabilities = await session.getCapabilities();

        expect(capabilities.get('browserstack.user')).toEqual(opts.user);
        expect(capabilities.get('browserstack.key')).toEqual(opts.key);
        expect(capabilities.get('os')).toEqual(platform.os);
        expect(capabilities.get('os_version')).toEqual(platform.osVersion);
        expect(capabilities.get('browserName')).toEqual(platform.browser);
        expect(capabilities.get('browser_version')).toEqual(platform.browserVersion);
        expect(capabilities.get('device')).toEqual(platform.deviceName);
        expect(capabilities.get('realMobile')).toEqual('true');
        expect(capabilities.get('browserstack.local')).toEqual(true);
        expect(capabilities.get('build')).toEqual(await buildinfo.get());
        expect(capabilities.get('name')).toEqual(opts.logMgr.logName);
    });

    it('can generate capabilities from the passed in BrowserStackBrowserSessionOptions', async () => {
        const session: BrowserStackBrowserSessionGeneratorPlugin = new BrowserStackBrowserSessionGeneratorPlugin();
        const platform: UiPlatform = new UiPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        });
        const opts: BrowserStackBrowserSessionOptions = {
            user: rand.getString(10, true, false, false, false),
            key: rand.getString(12, true, true, false, false),
            resolution: rand.getString(4, false, true) + 'x' + rand.getString(4, false, true),
            local: true,
            uiplatform: platform.toString(),
            logMgr: new AftLog({logName: 'can generate capabilities from the passed in BrowserStackBrowserSessionOptions'})
        };
        
        const capabilities: Capabilities = await session.getCapabilities(opts);

        expect(capabilities.get('browserstack.user')).toEqual(opts.user);
        expect(capabilities.get('browserstack.key')).toEqual(opts.key);
        expect(capabilities.get('os')).toEqual(platform.os);
        expect(capabilities.get('os_version')).toEqual(platform.osVersion);
        expect(capabilities.get('browserName')).toEqual(platform.browser);
        expect(capabilities.get('browser_version')).toEqual(platform.browserVersion);
        expect(capabilities.get('device')).toEqual(platform.deviceName);
        expect(capabilities.get('realMobile')).toEqual('true');
        expect(capabilities.get('browserstack.local')).toEqual(true);
        expect(capabilities.get('build')).toEqual(await buildinfo.get());
        expect(capabilities.get('name')).toEqual(opts.logMgr.logName);
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
        let plugin: BrowserStackBrowserSessionGeneratorPlugin = new BrowserStackBrowserSessionGeneratorPlugin({
            user: '%browserstack_user%',
            key: '%browserstack_key%',
            uiplatform: 'windows_10_chrome'
        });
        await using (await plugin.newUiSession(), async (session: BrowserSession<any>) => {
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