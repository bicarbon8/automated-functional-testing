import { AftConfig, rand } from "aft-core";
import { By, Capabilities } from "selenium-webdriver";
import { SeleniumGridSessionGeneratorPlugin } from "../../../src";
import { BrowserComponent } from "../../../src/components/browser-component";

describe('SeleniumGridSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in options', async () => {
        const uiplatform = {
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true)
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            }
        });
        const plugin: SeleniumGridSessionGeneratorPlugin = new SeleniumGridSessionGeneratorPlugin();
        const capabilities: Capabilities = await plugin.getCapabilities(aftCfg);

        expect(capabilities.get('platform')).toEqual(`${uiplatform.os} ${uiplatform.osVersion}`);
        expect(capabilities.get('browserName')).toEqual(`${uiplatform.browser} ${uiplatform.browserVersion}`);
    });
    
    /**
     * WARNING: this test will attempt to create an actual session on your own Selenium Grid
     * it should only be used for local debugging.
     * NOTE: you will need to set a value for the following via SeleniumGridConfig
     * or as environment variables:
     * - selenium_grid_url
     */
    xit('can create a session on Selenium Grid', async () => {
        let platform: string = 'windows_10_chrome';
        const uiplatform = {
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true)
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            }
        });
        const plugin: SeleniumGridSessionGeneratorPlugin = new SeleniumGridSessionGeneratorPlugin();
        const session = await plugin.getSession('local', aftCfg);
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