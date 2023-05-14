import { AftConfig, rand } from "aft-core";
import { By, Capabilities } from "selenium-webdriver";
import { GridSessionGeneratorPlugin } from "../../src";
import { SeleniumComponent } from "../../src/components/selenium-component";

describe('GridSessionGeneratorPlugin', () => {
    it('can generate capabilities from the passed in options', async () => {
        const sessionOpts = {
            "foo": true,
            "bar": 1234,
            "baz": rand.getString(5)
        };
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                options: sessionOpts
            }
        });
        const plugin: GridSessionGeneratorPlugin = new GridSessionGeneratorPlugin();
        const capabilities: Capabilities = await plugin.getCapabilities(aftCfg);

        expect(capabilities.get('foo')).toEqual(sessionOpts.foo);
        expect(capabilities.get('bar')).toEqual(sessionOpts.bar);
        expect(capabilities.get('baz')).toEqual(sessionOpts.baz);
    });
    
    /**
     * WARNING: this test will attempt to create an actual session on your own Selenium Grid
     * it should only be used for local debugging.
     * NOTE: you will need to set a value for the following via SeleniumGridConfig
     * or as environment variables:
     * - selenium_grid_url
     */
    xit('can create a session on Selenium Grid', async () => {
        const aftCfg = new AftConfig({
            UiSessionConfig: {
                options: {
                    platform: 'windows',
                    browserName: 'chrome'
                }
            }
        });
        const plugin: GridSessionGeneratorPlugin = new GridSessionGeneratorPlugin();
        const session = await plugin.getSession();
        try {
            let expectedUrl: string = 'https://the-internet.herokuapp.com/login';
            await session.navigate().to(expectedUrl);

            let actualUrl: string = await session.getCurrentUrl();

            expect(actualUrl).toEqual(expectedUrl);

            let facet = new SeleniumComponent({
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