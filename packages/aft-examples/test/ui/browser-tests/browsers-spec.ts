import { wait } from "aft-core";
import { BrowserTestWrapper, browserShould } from "aft-ui-browsers";
import { expect } from "chai";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";

describe('Functional Browser Tests using AFT-UI-BROWSERS', () => {
    it('can access websites using AFT and Page Widgets and Facets', async () => {
        await browserShould({description: 'can access websites using AFT and Page Widgets and Facets',
            testCases: ['C3456', 'C2345', 'C1234'],
            expect: async (tw: BrowserTestWrapper) => {
                let loginPage: HerokuLoginPage = await tw.session.getFacet(HerokuLoginPage);
                
                await tw.logMgr.step('navigate to LoginPage...');
                await loginPage.navigateTo();
                
                await tw.logMgr.step('login');
                await loginPage.login("tomsmith", "SuperSecretPassword!");

                await tw.logMgr.step('wait for message to appear...')
                await wait.untilTrue(async () => await loginPage.hasMessage(), 20000);
                
                await tw.logMgr.step('get message...');
                let message: string = await loginPage.getMessage();
                
                return expect(message).to.contain("You logged into a secure area!");
            }
        });
    });

    it('can recover from StaleElementExceptions automatically', async () => {
        await browserShould({
            expect: async (tw: BrowserTestWrapper) => {
                let loginPage: HerokuLoginPage = await tw.session.getFacet(HerokuLoginPage, {maxWaitMs: 5000});
                
                await tw.logMgr.step('navigate to LoginPage');
                await loginPage.navigateTo();
                
                await tw.logMgr.step('click login button...');
                await loginPage.content().then(async (c) => await c.getLoginButton()).then(async (button) => await button.click());
                await tw.logMgr.info('no exception thrown on click');

                await tw.logMgr.step('refresh page...');
                await tw.session.refresh();
                await tw.logMgr.info('page refreshed');

                await tw.logMgr.step('click login button after refresh...');
                await loginPage.content().then(async (c) => await c.getLoginButton()).then(async (button) => await button.click());
                await tw.logMgr.info('no exception thrown on click');
                return true;
            }, 
            testCases: ['C4567', 'C5678', 'C6789', 'C7890'], 
            description: 'can recover from StaleElementExceptions automatically'
        });
    });
});