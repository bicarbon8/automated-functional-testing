import { Verifier, buildInfo, containing, retry, using } from "aft-core";
import { AftJestTest } from "aft-jest-reporter";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { SeleniumSession } from "aft-ui-selenium";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    test('[C1234] can access websites using AFT and BrowserComponents', async () => {
        await new AftJestTest(expect).verify(async (v: Verifier) => {
            let loginMessage: string;
            await using(new SeleniumSession({
                reporter: v.reporter,
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

                loginMessage = await loginPage.getMessage();
            });
            return loginMessage;
        }).returns(containing("You logged into a secure area!"));
    });
});
