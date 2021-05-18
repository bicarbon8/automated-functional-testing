import { Verifier, verify, wait } from "aft-core";
import { verifyWithBrowser, BrowserVerifier } from "aft-ui-browsers";
import { expect } from "chai";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";

describe('Functional Browser Tests using AFT-UI-BROWSERS', () => {
    it('can access websites using AFT and Page Widgets and Facets', async () => {
        await verifyWithBrowser(async (tw: BrowserVerifier) => {
            let loginPage: HerokuLoginPage = await tw.session.getFacet(HerokuLoginPage);
            
            await tw.logMgr.step('navigate to LoginPage...');
            await loginPage.navigateTo();
            
            await tw.logMgr.step('login');
            await loginPage.login("tomsmith", "SuperSecretPassword!");

            await tw.logMgr.step('wait for message to appear...')
            await wait.untilTrue(async () => await loginPage.hasMessage(), 20000);
            
            await tw.logMgr.step('get message...');
            let message: string = await loginPage.getMessage();
            
            expect(message).to.contain("You logged into a secure area!");
        }).withDescription('can access websites using AFT and Page Widgets and Facets')
        .and.withTestId('C3456').and.withTestId('C2345').and.withTestId('C1234');
    });

    it('can recover from StaleElementExceptions automatically', async () => {
        await verifyWithBrowser(async (tw: BrowserVerifier) => {
            let loginPage: HerokuLoginPage = await tw.session.getFacet(HerokuLoginPage, {maxWaitMs: 5000});
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('navigate to LoginPage');
                await loginPage.navigateTo();
                return await loginPage.session.driver.getCurrentUrl();
            }).withLoggingPluginManager(tw.logMgr).and.withTestId('C4567')
            .returns('https://the-internet.herokuapp.com/login');
            
            await verify(async (v: Verifier) => {
                await v.logMgr.step('click login button...');
                await loginPage.content().then(async (c) => await c.getLoginButton()).then(async (button) => await button.click());
                await v.logMgr.info('no exception thrown on click');
            }).withLoggingPluginManager(tw.logMgr).and.withTestId('C5678');

            await verify(async (v: Verifier) => {
                await v.logMgr.step('refresh page...');
                await tw.session.refresh();
                await v.logMgr.info('page refreshed');
            }).withLoggingPluginManager(tw.logMgr).and.withTestId('C6789');

            await verify(async (v: Verifier) => {
                await tw.logMgr.step('click login button after refresh...');
                await loginPage.content().then(async (c) => await c.getLoginButton()).then(async (button) => await button.click());
                await tw.logMgr.info('no exception thrown on click');
            }).withLoggingPluginManager(tw.logMgr).and.withTestId('C7890');
        }).withDescription('can recover from StaleElementExceptions automatically');
    });
});