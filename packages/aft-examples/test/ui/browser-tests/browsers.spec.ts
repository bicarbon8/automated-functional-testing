import { AftConfig, containing, retry, Verifier, verify } from "aft-core";
import { AftLog, AftTest } from "aft-mocha-reporter";
import { SeleniumVerifier, verifyWithSelenium } from "aft-ui-selenium";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";
import { UiPlatform, UiSessionConfig } from "aft-ui";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    it.only('can access websites using AFT and BrowserComponents', async function() {
        const aft = new AftLog(this);
        await verifyWithSelenium(async (tw: SeleniumVerifier) => {
            let loginPage: HerokuLoginPage = tw.getComponent(HerokuLoginPage);
            
            await tw.logMgr.step('navigate to LoginPage...');
            await loginPage.navigateTo();
            
            await tw.logMgr.step('login');
            await loginPage.login("tomsmith", "SuperSecretPassword!");

            await tw.logMgr.step('wait for message to appear...')
            await retry(() => loginPage.hasMessage())
                .withDelay(100)
                .withBackOff('exponential')
                .withMaxDuration(20000);
            
            await tw.logMgr.step('get message...');
            return await loginPage.getMessage();
        }).internals.usingLogManager(aft.logMgr)
        .and.withTestIds('C3456').and.withTestIds('C2345').and.withTestIds('C1234')
        .returns(containing("You logged into a secure area!"));
    });

    it('can recover from StaleElementExceptions automatically', async function() {
        const aft = new AftTest(this);
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            this.skip();
        }
        await verifyWithSelenium(async (tw: SeleniumVerifier) => {
            let loginPage: HerokuLoginPage = await tw.getComponent(HerokuLoginPage);
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('navigate to LoginPage');
                await loginPage.navigateTo();
                return await loginPage.driver.getCurrentUrl();
            }).internals.usingLogManager(tw.logMgr).and.withTestIds('C4567')
            .returns(containing('the-internet.herokuapp.com/login'));
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('click login button...');
                await loginPage.content().then(c => c.getLoginButton()).then(button => button.click());
                await v.logMgr.info('no exception thrown on click');
            }).internals.usingLogManager(tw.logMgr).and.withTestIds('C5678');

            await verify(async (v: Verifier) => {
                await v.logMgr.step('refresh page...');
                await tw.driver.navigate().refresh();
                await v.logMgr.info('page refreshed');
            }).internals.usingLogManager(tw.logMgr).and.withTestIds('C6789');

            await verify(async (v: Verifier) => {
                await tw.logMgr.step('click login button after refresh...');
                await loginPage.content().then(c => c.getLoginButton()).then(button => button.click());
                await tw.logMgr.info('no exception thrown on click');
            }).internals.usingLogManager(tw.logMgr).and.withTestIds('C7890');
        }).internals.usingLogManager(aft.logMgr);
    });

    const uiplatforms = [
        'osx_+_safari_latest',
        'windows_11_firefox',
        'windows_11_edge_+_+'
    ];
    for (var uiplatform of uiplatforms) {
        it(`can run with multiple uiplatforms: ${uiplatform}`, async function() {
            const aftCfg = new AftConfig();
            const uisc = aftCfg.getSection(UiSessionConfig);
            uisc.uiplatform = UiPlatform.parse(uiplatform);
            const aft = new AftLog(this, aftCfg);
            await verifyWithSelenium(async (tw: SeleniumVerifier) => {
                let loginPage: HerokuLoginPage = tw.getComponent(HerokuLoginPage);
                await loginPage.navigateTo();
                await loginPage.login("tomsmith", "SuperSecretPassword!");
                await retry(() => loginPage.hasMessage())
                    .withDelay(100)
                    .withBackOff('exponential')
                    .withMaxDuration(20000)
                    .until((res: boolean) => res);
                return await loginPage.getMessage();
            }).internals.usingAftConfig(aftCfg)
            .and.internals.usingLogManager(aft.logMgr)
            .returns(containing("You logged into a secure area!"));
        });
    }
});