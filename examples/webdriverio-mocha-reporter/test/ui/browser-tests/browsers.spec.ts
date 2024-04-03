import { BuildInfoManager, buildInfo, retry, using } from "aft-core";
import { AftTest } from "aft-mocha-reporter";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { WebdriverIoSession } from "aft-ui-webdriverio";
import { expect } from "chai";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    it('[C1234] can access websites using AFT and BrowserComponents', async function() {
        const aft = new AftTest(this);
        if (!(await aft.shouldRun())) {
            await aft.pending();
        } else {
            await using(new WebdriverIoSession({
                reporter: aft.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        "bstack:options": {
                            sessionName: aft.reporter.reporterName,
                            buildName: await buildInfo.get()
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

                const expected = "You logged into a secure area!";
                const actual: string = await loginPage.getMessage();
                expect(actual).to.contain(expected);
            });
        }
    });

    it('[C2345] can recover from StaleElementExceptions automatically', async function() {
        const aft = new AftTest(this);
        if (!(await aft.shouldRun())) {
            await aft.pending();
        } else {
            await using(new WebdriverIoSession({
                reporter: aft.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'chrome',
                        "bstack:options": {
                            sessionName: aft.reporter.reporterName,
                            buildName: await buildInfo.get()
                        }
                    }
                }
            }), async (session: WebdriverIoSession) => {
                const loginPage = await session.getComponent(HerokuLoginPage);
                
                await session.reporter.step('navigate to LoginPage');
                await loginPage.navigateTo();

                expect(await loginPage.driver.getUrl()).to.contain('the-internet.herokuapp.com/login');
                
                await session.reporter.step('click login button...');
                await loginPage.content.getLoginButton()
                    .then(button => button.click());
                await session.reporter.info('no exception thrown on click');

                await session.reporter.step('refresh page...');
                await session.driver<WebdriverIO.Browser>()
                    .then(d => d.refresh());
                await session.reporter.info('page refreshed');

                await session.reporter.step('click login button after refresh...');
                await loginPage.content.getLoginButton()
                    .then(button => button.click());
                await session.reporter.info('no exception thrown on click');
            });
        }
    });

    const uiplatforms = [
        { testId: '[C3456]', browser: 'safari', deviceName: 'iPhone 14 Pro Max', osV: '16' },
        { testId: '[C4567]', browser: 'chrome', deviceName: 'Samsung Galaxy S23', osV: '13.0' }
    ];
    for (const uip of uiplatforms) {
        it(`${uip.testId} can run with multiple uiplatforms: ${uip.deviceName} ${uip.osV} ${uip.browser}`, async function() {
            const aft = new AftTest(this);
            if (!(await aft.shouldRun())) {
                await aft.pending();
            } else {
                await using(new WebdriverIoSession({
                    reporter: aft.reporter,
                    additionalSessionOptions: {
                        capabilities: {
                            browserName: uip.browser,
                            "bstack:options": {
                                sessionName: aft.reporter.reporterName,
                                deviceName: uip.deviceName,    // adds Device Name to values from `aftconfig.json` file
                                osVersion: uip.osV,            // overrides `osVersion` in `aftconfig.json` file
                                buildName: await buildInfo.get()
                            }
                        }
                    }
                }), async (session: WebdriverIoSession) => {
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
            }
        });
    }
});
