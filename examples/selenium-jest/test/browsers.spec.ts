import { containing, retry, using } from "aft-core";
import { AftJestTest, aftJestTest } from "aft-jest-reporter";
import { HerokuLoginPage } from "../lib/page-objects/heroku-login-page";
import { SeleniumSession } from "aft-ui-selenium";

describe('Functional Browser Tests using Selenium and Jest', () => {
    test('[C1234] can access websites using AFTs AftTest and SeleniumSession', async () => {
        await aftJestTest(expect, async (v: AftJestTest) => {
            let loginMessage: string;
            await using(new SeleniumSession({
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
            await v.verify(loginMessage, containing("You logged into a secure area!"));
        });
    });

    test('[C2345] can access websites using AFTs SeleniumSession without AftTest', async () => {
        const aft = new AftJestTest(expect);
        const shouldRun = await aft.shouldRun();
        if (shouldRun.result !== true) {
            // mark test as pending and bail out
            await aft.pending(shouldRun.message);
            return; // Jest doesn't support programmatic skip https://github.com/jestjs/jest/issues/7245
        }
        await using(new SeleniumSession({
            reporter: aft.reporter,
            additionalSessionOptions: {
                capabilities: {
                    browserName: 'chrome',
                    "bstack:options": {
                        sessionName: aft.reporter.name,
                        buildName: await aft.buildInfoManager.get()
                    }
                }
            }
        }), async (session) => {
            const loginPage = await session.getComponent(HerokuLoginPage);
            
            await aft.reporter.step('navigate to LoginPage...');
            await loginPage.navigateTo();
            
            await aft.reporter.step('login');
            await loginPage.login("tomsmith", "SuperSecretPassword!");

            await aft.reporter.step('wait for message to appear...')
            await retry(() => loginPage.hasMessage())
                .withDelay(100)
                .withBackOff('exponential')
                .withMaxDuration(20000);
            
            await aft.reporter.step('get message...');

            const expected = "You logged into a secure area!";
            const actual = await loginPage.getMessage();
            expect(actual).toContain(expected);
        });
    });
});
