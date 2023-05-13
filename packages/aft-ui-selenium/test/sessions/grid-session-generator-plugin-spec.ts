import { AftConfig, rand } from "aft-core";
import { By, Capabilities } from "selenium-webdriver";
import { GridSessionGeneratorPlugin } from "../../src";
import { BrowserComponent } from "../../src/components/browser-component";

describe('GridSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in options', async () => {
        const uiplatform = {
            os: 'os-' + rand.getString(10),
            osVersion: 'osVersion-' + rand.getString(2, false, true),
            browser: 'browser-' + rand.getString(15),
            browserVersion: 'browserVersion-' + rand.getString(2, false, true)
        };
        const gsc = {
            capabilities: {
                "foo": true,
                "bar": 1234,
                "baz": rand.getString(5)
            }
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            },
            GridSessionConfig: gsc
        });
        const plugin: GridSessionGeneratorPlugin = new GridSessionGeneratorPlugin();
        const capabilities: Capabilities = await plugin.getCapabilities(aftCfg);

        expect(capabilities.get('platform')).toEqual(`${uiplatform.os} ${uiplatform.osVersion}`);
        expect(capabilities.get('browserName')).toEqual(`${uiplatform.browser} ${uiplatform.browserVersion}`);
        expect(capabilities.get('foo')).toEqual(gsc.capabilities.foo);
        expect(capabilities.get('bar')).toEqual(gsc.capabilities.bar);
        expect(capabilities.get('baz')).toEqual(gsc.capabilities.baz);
    });
    
    /**
     * WARNING: this test will attempt to create an actual session on your own Selenium Grid
     * it should only be used for local debugging.
     * NOTE: you will need to set a value for the following via SeleniumGridConfig
     * or as environment variables:
     * - selenium_grid_url
     */
    xit('can create a session on Selenium Grid', async () => {
        const uiplatform = {
            os: 'windows',
            osVersion: '11',
            browser: 'chrome'
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                uiplatform: uiplatform
            }
        });
        const plugin: GridSessionGeneratorPlugin = new GridSessionGeneratorPlugin();
        const session = await plugin.getSession();
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