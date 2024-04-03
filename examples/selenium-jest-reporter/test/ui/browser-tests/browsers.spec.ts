import { Verifier, buildInfo, retry, using } from "aft-core";
import { AftTest } from "aft-jest-reporter";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { SeleniumSession } from "aft-ui-selenium";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    test('[C1234] can access websites using AFT and BrowserComponents', async () => {
        await new AftTest(expect).verify(async (v: Verifier) => {
            await using(new SeleniumSession({
                aftConfig: v.aftCfg,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        "bstack:options": {
                            sessionName: v.reporter.reporterName,
                            buildName: await buildInfo.get()
                        }
                    }
                }
            }), async (session) => {
                const loginPage = await session.getComponent(HerokuLoginPage);
                
                await v.reporter.step('navigate to LoginPage...');
                await loginPage.navigateTo();
                
                await v.reporter.step('login');
                await loginPage.login("tomsmith", "SuperSecretPassword!");

                await v.reporter.step('wait for message to appear...')
                await retry(() => loginPage.hasMessage())
                    .withDelay(100)
                    .withBackOff('exponential')
                    .withMaxDuration(20000);
                
                await v.reporter.step('get message...');

                const expected = "You logged into a secure area!";
                const actual = await loginPage.getMessage();
                expect(actual).toContain(expected);
            });
        });
    });
});
