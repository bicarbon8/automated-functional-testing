import { Verifier, containing, retry, using } from "aft-core";
import { AftMochaTest } from "aft-mocha-reporter";
import { HerokuLoginPage } from "../lib/page-objects/browser-app/heroku-login-page";
import { WebdriverIoSession } from "aft-ui-webdriverio";

describe('Functional Browser Tests using WebdriverIO and Mocha', () => {
    it('[C1234] can access websites using AFT Verifier and WebdriverIoSession', async function() {
        await new AftMochaTest(this).verify(async (v: Verifier) => {
            let loginMessage = '';
            await using(new WebdriverIoSession({
                reporter: v.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        "bstack:options": {
                            sessionName: v.reporter.loggerName,
                            buildName: await v.buildInfoMgr.get()
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
            return loginMessage;
        }).returns(containing("You logged into a secure area!"));
    });
});
