import { By, Capabilities, WebDriver } from 'selenium-webdriver';
import { rand, BuildInfoManager, AftConfig } from "aft-core";
import { BrowserStackAutomateSessionGeneratorPlugin } from '../../../src';
import { BrowserComponent } from '../../../src/components/browser-component';

describe('BrowserStackAutomateSessionGeneratorPlugin', () => {
    it('can generate capabilities from the BrowserStackConfig section of AftConfig', async () => {
        const uiplatform = {
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true),
            deviceName: 'deviceName-' + rand.getString(22)
        };
        const bsc = {
            user: rand.getString(14),
            key: rand.getString(15, true, true)
        }
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            },
            BrowserStackAutomateConfig: bsc
        });
        const identifier = rand.getString(100);
        const session: BrowserStackAutomateSessionGeneratorPlugin = new BrowserStackAutomateSessionGeneratorPlugin();

        const capabilities: Capabilities = await session.getCapabilities(identifier, aftCfg);

        expect(capabilities.get('browserstack.user')).toEqual(bsc.user);
        expect(capabilities.get('browserstack.key')).toEqual(bsc.key);
        expect(capabilities.get('os')).toEqual(uiplatform.os);
        expect(capabilities.get('os_version')).toEqual(uiplatform.osVersion);
        expect(capabilities.get('browserName')).toEqual(uiplatform.browser);
        expect(capabilities.get('browser_version')).toEqual(uiplatform.browserVersion);
        expect(capabilities.get('device')).toEqual(uiplatform.deviceName);
        expect(capabilities.get('realMobile')).toEqual('true');
        expect(capabilities.get('browserstack.local')).toEqual(true);
        expect(capabilities.get('build')).toEqual(await new BuildInfoManager(aftCfg).get());
        expect(capabilities.get('name')).toEqual(identifier);
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
        const uiplatform = {
            os: 'windows',
            osVersion: '11',
            browser: 'chrome'
        };
        const bsc = {
            user: '%browserstack_user%',
            key: '%browserstack_key%'
        }
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            },
            BrowserStackAutomateConfig: bsc
        });
        const identifier = rand.getString(100);
        const plugin: BrowserStackAutomateSessionGeneratorPlugin = new BrowserStackAutomateSessionGeneratorPlugin();
        const session = await plugin.getSession(identifier, aftCfg) as WebDriver;
        try {
            let expectedUrl: string = 'https://the-internet.herokuapp.com/login';
            await session.navigate().to(expectedUrl);

            let actualUrl: string = await session.getCurrentUrl();

            expect(actualUrl).toEqual(expectedUrl);

            let facet = new BrowserComponent({
                driver: session,
                locator: By.css('button.radius')
            });

            expect(facet.driver).toBeDefined();
            expect(await facet.getRoot().then(r => r.getText())).toEqual('Login');
        } finally {
            session?.close();
            session?.quit();
        }
    }, 300000);
});