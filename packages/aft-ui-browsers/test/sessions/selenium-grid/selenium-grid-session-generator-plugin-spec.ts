import { rand } from "aft-core";
import { TestPlatform } from "aft-ui";
import { BrowserFacet, BrowserSession, SeleniumGridSessionGeneratorPlugin } from "../../../src";
import { By, Capabilities } from "selenium-webdriver";

describe('SeleniumGridSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in options', async () => {
        let platform: TestPlatform = new TestPlatform({
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true)
        });
        let plugin: SeleniumGridSessionGeneratorPlugin = new SeleniumGridSessionGeneratorPlugin({
            platform: platform.toString()
        });
        let capabilities: Capabilities = await plugin.getCapabilities();

        expect(capabilities.get('platform')).toEqual(`${platform.os} ${platform.osVersion}`);
        expect(capabilities.get('browserName')).toEqual(`${platform.browser} ${platform.browserVersion}`);
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
        let plugin: SeleniumGridSessionGeneratorPlugin = new SeleniumGridSessionGeneratorPlugin({platform: platform});
        let session: BrowserSession = await plugin.newSession();
        
        let expectedUrl: string = 'https://the-internet.herokuapp.com/login';
        await session.goTo(expectedUrl);

        let actualUrl: string = await session.driver.getCurrentUrl();

        expect(actualUrl).toEqual(expectedUrl);

        let facet: BrowserFacet = await session.getFacet(BrowserFacet, {locator: By.css('button.radius')});

        expect(facet).toBeDefined();
        expect(await facet.getRoot().then(async (r) => await r.getText())).toEqual('Login');
    }, 300000);
});