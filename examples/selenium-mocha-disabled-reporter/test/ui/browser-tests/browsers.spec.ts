import { BuildInfoManager, Verifier, buildInfo, retry, using } from "aft-core";
import { AftTest } from "aft-mocha-reporter";
import { SeleniumSession } from "aft-ui-selenium";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { expect } from "chai";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    it('[C1234] can access websites using AFT and BrowserComponents', async function() {
        await new AftTest(this).verify(async (v: Verifier) => {
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
                const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
                
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
                
                const expected = "You logged into a secure area!";
                const actual: string = await loginPage.getMessage();
                expect(actual).to.contain(expected);
            });
        });
    });

    it('[C2345] can recover from StaleElementExceptions automatically', async function() {
        await new AftTest(this).verify(async (v: Verifier) => {
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
                const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
                
                await v.reporter.step('navigate to LoginPage');
                await loginPage.navigateTo();
                
                const actual: string =  await loginPage.driver.getCurrentUrl();
                const expected = 'the-internet.herokuapp.com/login';
                expect(actual).to.contain(expected);
                
                await v.reporter.step('click login button...');
                await loginPage.content.getLoginButton().then(button => button.click());
                await v.reporter.info('no exception thrown on click');

                await v.reporter.step('refresh page...');
                await loginPage.driver.navigate().refresh();
                await v.reporter.info('page refreshed');

                await v.reporter.step('click login button after refresh...');
                await loginPage.content.getLoginButton().then(button => button.click());
                await v.reporter.info('no exception thrown on click');
            });
        });
    });

    const uiplatforms = [
        { testId: '[C3456]', browser: 'safari', os: 'os x', osV: 'sonoma' },
        { testId: '[C5678]', browser: 'firefox', os: 'windows', osV: '11' },
        { testId: '[C6789]', browser: 'edge', os: 'windows', osV: '11' },
    ];
    for (const uiplatform of uiplatforms) {
        it(`${uiplatform.testId} can run with multiple uiplatforms: ${uiplatform.os} ${uiplatform.osV} ${uiplatform.browser}`, async function() {
            await new AftTest(this).verify(async (v: Verifier) => {
                await using(new SeleniumSession({
                    reporter: v.reporter,
                    additionalSessionOptions: {
                        capabilities: {
                            browserName: uiplatform.browser,
                            "bstack:options": {
                                sessionName: v.reporter.reporterName,
                                os: uiplatform.os,            // override os in `aftconfig.json` file
                                osVersion: uiplatform.osV,    // override osVersion in `aftconfig.json` file
                                buildName: await buildInfo.get()
                            }
                        }
                    }
                }), async (session) => {
                    const loginPage: HerokuLoginPage = await session.getComponent(HerokuLoginPage);
                    await loginPage.navigateTo();
                    await loginPage.login("tomsmith", "SuperSecretPassword!");
                    await retry(() => loginPage.hasMessage())
                        .withDelay(100)
                        .withBackOff('exponential')
                        .withMaxDuration(20000)
                        .until((res: boolean) => res);
                    
                    const actual: string = await loginPage.getMessage();
                    const expected = "You logged into a secure area!";
                    expect(actual).to.contain(expected);
                });
            });
        });
    }
});
