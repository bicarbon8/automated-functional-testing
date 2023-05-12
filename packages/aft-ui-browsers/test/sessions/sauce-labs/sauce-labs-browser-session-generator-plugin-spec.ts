import { By, Capabilities } from 'selenium-webdriver';
import { rand, BuildInfoManager, AftConfig } from "aft-core";
import { SauceLabsBrowserSessionGeneratorPlugin } from '../../../src';
import { BrowserComponent } from '../../../src/components/browser-component';

describe('SauceLabsBrowserSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in SauceLabsBrowserConfig via AftConfig', async () => {
        const uiplatform = {
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        };
        const slbc = {
            username: rand.getString(10, true, false, false, false),
            accessKey: rand.getString(12, true, true, false, false),
            resolution: rand.getString(4, false, true) + 'x' + rand.getString(4, false, true),
            tunnel: true,
            tunnelIdentifier: rand.getString(11, true)
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            },
            SauceLabsBrowserConfig: slbc
        });
        const identifier = rand.getString(100);
        const session: SauceLabsBrowserSessionGeneratorPlugin = new SauceLabsBrowserSessionGeneratorPlugin();

        const caps: Capabilities = await session.getCapabilities(identifier, aftCfg);

        expect(caps.get('platformName')).toEqual(uiplatform.os);
        expect(caps.get('platformVersion')).toEqual(uiplatform.osVersion);
        expect(caps.get('browserName')).toEqual(uiplatform.browser);
        expect(caps.get('browserVersion')).toEqual(uiplatform.browserVersion);
        expect(caps.get('deviceName')).toEqual(uiplatform.deviceName);
        let sauceOpts: object = caps.get('sauce:options');
        expect(sauceOpts).toBeDefined();
        expect(sauceOpts['build']).toEqual(await new BuildInfoManager(aftCfg).get());
        expect(sauceOpts['name']).toEqual(identifier);
        expect(sauceOpts['screenResolution']).toEqual(slbc.resolution);
        expect(sauceOpts['tunnelIdentifier']).toEqual(slbc.tunnelIdentifier);
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
        const uiplatform = {
            os: 'windows',
            osVersion: '11',
            browser: 'chrome'
        };
        const slbc = {
            username: '%saucelabs_username%',
            accessKey: '%saucelabs_accessKey'
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            },
            SauceLabsBrowserConfig: slbc
        });
        const identifier = rand.getString(100);
        const plugin: SauceLabsBrowserSessionGeneratorPlugin = new SauceLabsBrowserSessionGeneratorPlugin();
        const session = await plugin.getSession(identifier, aftCfg);
        try {
            let expectedUrl: string = 'https://the-internet.herokuapp.com/login';
            await session.navigate().to(expectedUrl);

            let actualUrl: string = await session.getCurrentUrl();

            expect(actualUrl).toEqual(expectedUrl);

            let facet = new BrowserComponent({
                driver: session,
                locator: By.css('button.radius')
            });

            expect(facet).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        } finally {
            session?.close();
            session?.quit();
        }
    }, 300000);
});