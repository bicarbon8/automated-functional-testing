import { containing, retry, using } from "aft-core";
import { aftMochaTest, AftMochaTest } from "aft-mocha-reporter";
import { SeleniumSession } from "aft-ui-selenium";
import { HerokuLoginPage } from "../lib/page-objects/heroku-login-page";
import { expect } from "chai";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    it('[C1234] can access websites using AFT and BrowserComponents', async function() {
        await aftMochaTest(this, async (v: AftMochaTest) => {
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
                const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
                
                await session.reporter.step('navigate to LoginPage...');
                await loginPage.navigateTo();
                
                await session.reporter.step('login');
                await loginPage.login("tomsmith", "SuperSecretPassword!");

                await session.reporter.step('wait for message to appear...')
                const actual = await retry(() => loginPage.getMessage())
                    .withDelay(100)
                    .withBackOffType('exponential')
                    .withMaxDuration(20000)
                    .start();
                
                await session.reporter.step('compare message...');
                const expected = "You logged into a secure area!";
                await v.verify(actual, containing(expected));
            });
        });
    });

    it('[C2345] can recover from StaleElementExceptions automatically', async function() {
        const aft = new AftMochaTest(this);
        const shouldRun = await aft.shouldRun();
        if (shouldRun.result !== true) {
            await aft.pending(shouldRun.message); // calls this.test.skip();
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
            const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
            
            await session.reporter.step('navigate to LoginPage');
            await loginPage.navigateTo();
            
            const actual: string =  await loginPage.driver.getCurrentUrl();
            const expected = 'the-internet.herokuapp.com/login';
            expect(actual).to.contain(expected);
            
            await session.reporter.step('click login button...');
            await loginPage.content.getLoginButton().then(button => button.click());
            await session.reporter.info('no exception thrown on click');

            await session.reporter.step('refresh page...');
            await loginPage.driver.navigate().refresh();
            await session.reporter.info('page refreshed');

            await session.reporter.step('click login button after refresh...');
            await loginPage.content.getLoginButton().then(button => button.click());
            await session.reporter.info('no exception thrown on click');
        });
    });

    const uiplatforms = [
        { testId: '[C3456]', browser: 'safari', os: 'os x', osV: 'sonoma' },
        { testId: '[C5678]', browser: 'firefox', os: 'windows', osV: '11' },
        { testId: '[C6789]', browser: 'edge', os: 'windows', osV: '11' },
    ];
    for (const uiplatform of uiplatforms) {
        it(`${uiplatform.testId} can run with multiple uiplatforms: ${uiplatform.os} ${uiplatform.osV} ${uiplatform.browser}`, async function() {
            await aftMochaTest(this, async (v: AftMochaTest) => {
                let loginMessage = '';
                await using(new SeleniumSession({
                    reporter: v.reporter,
                    additionalSessionOptions: {
                        capabilities: {
                            browserName: uiplatform.browser,
                            "bstack:options": {
                                sessionName: v.reporter.name,
                                os: uiplatform.os,            // override os in `aftconfig.json` file
                                osVersion: uiplatform.osV,    // override osVersion in `aftconfig.json` file
                                buildName: await v.buildInfoManager.get()
                            }
                        }
                    }
                }), async (session) => {
                    const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
                    await loginPage.navigateTo();
                    await loginPage.login("tomsmith", "SuperSecretPassword!");
                    await retry(() => loginPage.hasMessage())
                        .withDelay(100)
                        .withBackOffType('exponential')
                        .withMaxDuration(20000)
                        .until((res: boolean) => res);
                    
                    loginMessage = await loginPage.getMessage();
                });
                await v.verify(loginMessage, containing("You logged into a secure area!"));
            });
        });
    }
});
