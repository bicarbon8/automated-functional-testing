import { containing, retry, Verifier, verify } from "aft-core";
import { AftLog, AftTest } from "aft-mocha-reporter";
import { verifyWithBrowser, BrowserVerifier, BrowserFacetOptions } from "aft-ui-browsers";
import { expect } from "chai";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";

describe('Functional Browser Tests using AFT-UI-BROWSERS', () => {
    it('can access websites using AFT and Page Widgets and Facets', async function() {
        const aft = new AftLog(this);
        await verifyWithBrowser(async (tw: BrowserVerifier) => {
            let loginPage: HerokuLoginPage = await tw.session.getFacet<HerokuLoginPage, BrowserFacetOptions>(HerokuLoginPage);
            
            await tw.logMgr.step('navigate to LoginPage...');
            await loginPage.navigateTo();
            
            await tw.logMgr.step('login');
            await loginPage.login("tomsmith", "SuperSecretPassword!");

            await tw.logMgr.step('wait for message to appear...')
            await retry(() => loginPage.hasMessage())
                .withStartDelayBetweenAttempts(100)
                .withBackOff('exponential')
                .withMaxDuration(20000);
            
            await tw.logMgr.step('get message...');
            return await loginPage.getMessage();
        }).withLogManager(aft.logMgr)
        .and.withTestIds('C3456').and.withTestIds('C2345').and.withTestIds('C1234')
        .returns(containing("You logged into a secure area!"));
    });

    it('can recover from StaleElementExceptions automatically', async function() {
        const aft = new AftTest(this);
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            this.skip();
        }
        await verifyWithBrowser(async (tw: BrowserVerifier) => {
            let loginPage: HerokuLoginPage = await tw.session.getFacet<HerokuLoginPage, BrowserFacetOptions>(HerokuLoginPage, {maxWaitMs: 5000});
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('navigate to LoginPage');
                await loginPage.navigateTo();
                return await loginPage.session.driver.getCurrentUrl();
            }).withLogManager(tw.logMgr).and.withTestIds('C4567')
            .returns(containing('the-internet.herokuapp.com/login'));
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('click login button...');
                await loginPage.content().then(c => c.getLoginButton()).then(button => button.click());
                await v.logMgr.info('no exception thrown on click');
            }).withLogManager(tw.logMgr).and.withTestIds('C5678');

            await verify(async (v: Verifier) => {
                await v.logMgr.step('refresh page...');
                await tw.session.refresh();
                await v.logMgr.info('page refreshed');
            }).withLogManager(tw.logMgr).and.withTestIds('C6789');

            await verify(async (v: Verifier) => {
                await tw.logMgr.step('click login button after refresh...');
                await loginPage.content().then(c => c.getLoginButton()).then(button => button.click());
                await tw.logMgr.info('no exception thrown on click');
            }).withLogManager(tw.logMgr).and.withTestIds('C7890');
        }).withLogManager(aft.logMgr);
    });

    const uiplatforms = [
        'os x_+_safari',
        'windows_11_firefox',
        'windows_11_edge_+_+'
    ];
    for (var i=0; i<uiplatforms.length; i++) {
        let uiplatform = uiplatforms[i];
        it(`can run with multiple uiplatforms: ${uiplatform}`, async function() {
            const aft = new AftLog(this);
            await verifyWithBrowser(async (tw: BrowserVerifier) => {
                let loginPage: HerokuLoginPage = await tw.session.getFacet<HerokuLoginPage, BrowserFacetOptions>(HerokuLoginPage);
                await loginPage.navigateTo();
                await loginPage.login("tomsmith", "SuperSecretPassword!");
                await retry(() => loginPage.hasMessage())
                    .until((res: boolean) => res)
                    .withStartDelayBetweenAttempts(100)
                    .withBackOff('exponential')
                    .withMaxDuration(20000);
                return await loginPage.getMessage();
            }).withLogManager(aft.logMgr)
            .and.withBrowserSessionOptions({uiplatform: uiplatform})
            .returns(containing("You logged into a secure area!"));
        });
    }
});