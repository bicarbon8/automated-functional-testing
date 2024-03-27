import { AftConfig, BuildInfoManager, containing, pluginLoader, retry, Verifier } from "aft-core";
import { AftTest } from "aft-mocha-reporter";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { WebdriverIoVerifier } from "aft-ui-webdriverio";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    it('[C3456][C2345][C1234] can access websites using AFT and BrowserComponents', async function() {
        const aftCfg = new AftConfig();
        const aft = new AftTest(this, aftCfg);
        await aft.verify(async (tw: WebdriverIoVerifier) => {
            let loginPage: HerokuLoginPage = tw.getComponent(HerokuLoginPage);
            
            await tw.reporter.step('navigate to LoginPage...');
            await loginPage.navigateTo();
            
            await tw.reporter.step('login');
            await loginPage.login("tomsmith", "SuperSecretPassword!");

            await tw.reporter.step('wait for message to appear...')
            await retry(() => loginPage.hasMessage())
                .withDelay(100)
                .withBackOff('exponential')
                .withMaxDuration(20000);
            
            await tw.reporter.step('get message...');
            return await loginPage.getMessage();
        }, WebdriverIoVerifier).withAdditionalSessionOptions({
            capabilities: {
                browserName: 'chrome',
                "bstack:options": {
                    sessionName: aft.reporter.reporterName,
                    os: 'windows',
                    osVersion: '11',
                    buildName: await new BuildInfoManager().get()
                }
            }
        }).returns(containing("You logged into a secure area!"));
    });

    it('can recover from StaleElementExceptions automatically', async function() {
        const aftCfg = new AftConfig();
        const aft = new AftTest(this, aftCfg);
        await aft.verify(async (tw: WebdriverIoVerifier) => {
            let loginPage: HerokuLoginPage = tw.getComponent(HerokuLoginPage);
            
            await aft.verify(async (v: Verifier) => {
                await v.reporter.step('navigate to LoginPage');
                await loginPage.navigateTo();
                return await loginPage.driver.getUrl();
            }).withTestIds('C4567')
            .returns(containing('the-internet.herokuapp.com/login'));
            
            await aft.verify(async (v: Verifier) => {
                await v.reporter.step('click login button...');
                await loginPage.content.getLoginButton().then(button => button.click());
                await v.reporter.info('no exception thrown on click');
            }).withTestIds('C5678');

            await aft.verify(async (v: Verifier) => {
                await v.reporter.step('refresh page...');
                await tw.browser.refresh();
                await v.reporter.info('page refreshed');
            }).withTestIds('C6789');

            await aft.verify(async (v: Verifier) => {
                await tw.reporter.step('click login button after refresh...');
                await loginPage.content.getLoginButton().then(button => button.click());
                await tw.reporter.info('no exception thrown on click');
            }).withTestIds('C7890');
        }, WebdriverIoVerifier).withAdditionalSessionOptions({
            capabilities: {
                browserName: 'chrome',
                "bstack:options": {
                    sessionName: aft.reporter.reporterName,
                    os: 'windows',
                    osVersion: '11',
                    buildName: await new BuildInfoManager().get()
                }
            }
        });
    });

    const uiplatforms = [
        { browser: 'safari', deviceName: 'iPhone 14 Pro Max', osV: '16' },
        { browser: 'chrome', deviceName: 'Samsung Galaxy S23', osV: '13.0' }
    ];
    for (let uiplatform of uiplatforms) {
        it(`can run with multiple uiplatforms: ${JSON.stringify(uiplatform)}`, async function() {
            const platform = Object.freeze({...uiplatform});
            const aftCfg = new AftConfig();
            const aft = new AftTest(this, aftCfg);
            await aft.verify(async (tw: WebdriverIoVerifier) => {
                let loginPage: HerokuLoginPage = tw.getComponent(HerokuLoginPage);
                await loginPage.navigateTo();
                await loginPage.login("tomsmith", "SuperSecretPassword!");
                await retry(() => loginPage.hasMessage())
                    .withDelay(100)
                    .withBackOff('exponential')
                    .withMaxDuration(20000)
                    .until((res: boolean) => res);
                return await loginPage.getMessage();
            }, WebdriverIoVerifier).withAdditionalSessionOptions({
                capabilities: {
                    browserName: platform.browser,
                    "bstack:options": {
                        sessionName: aft.reporter.reporterName,
                        deviceName: platform.deviceName,
                        osVersion: platform.osV,
                        buildName: await new BuildInfoManager(aftCfg).get()
                    }
                }
            }).returns(containing("You logged into a secure area!"));
        });
    }
});