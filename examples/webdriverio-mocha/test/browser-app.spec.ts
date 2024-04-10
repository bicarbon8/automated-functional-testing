import { containing, retry, using } from "aft-core";
import { aftMochaTest, AftMochaTest } from "aft-mocha-reporter";
import { HerokuLoginPage } from "../lib/page-objects/browser-app/heroku-login-page";
import { WebdriverIoSession } from "aft-ui-webdriverio";

describe('Functional Browser Tests using WebdriverIO and Mocha', () => {
    it('[C1234] can access websites using AFTs AftTest and WebdriverIoSession', async function() {
        await aftMochaTest(this, async (v: AftMochaTest) => {
            let loginMessage = '';
            await using(new WebdriverIoSession({
                reporter: v.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        "bstack:options": {
                            sessionName: v.reporter.name,
                            buildName: await v.buildInfoManager.get()
                        }
                    }
                }
            }), async (session: WebdriverIoSession) => {
                const loginPage = await session.getComponent(HerokuLoginPage);
                
                await session.reporter.step('navigate to LoginPage...');
                await loginPage.navigateTo();
                
                await session.reporter.step('login');
                await loginPage.login("tomsmith", "SuperSecretPassword!");

                await session.reporter.step('wait for message to appear...')
                await retry(() => loginPage.hasMessage())
                    .withDelay(100)
                    .withBackOff('exponential')
                    .withMaxDuration(20000);
                
                await session.reporter.step('get message...');

                loginMessage = await loginPage.getMessage();
            });
            await v.verify(loginMessage, containing("You logged into a secure area!"));
        });
    });
});
