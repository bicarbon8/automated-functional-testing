import { wait } from "aft-core";
import { BrowserTestWrapper, browserShould } from "aft-ui-selenium";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";

describe('Functional Browser Tests using AFT-UI', () => {
    beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 180000;
    });
  
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
                await wait.untilTrue(() => loginPage.hasMessage(), 20000);
                
                await tw.logMgr.step('get message...');
                let message: string = await loginPage.getMessage();
                
                return expect(message).toContain("You logged into a secure area!");
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
                await loginPage.content().then((c) => c.getLoginButton()).then((button) => button.click());
                await tw.logMgr.info('no exception thrown on click');

                await tw.logMgr.step('refresh page...');
                await tw.session.refresh();
                await tw.logMgr.info('page refreshed');

                await tw.logMgr.step('click login button after refresh...');
                await loginPage.content().then((c) => c.getLoginButton()).then((button) => button.click());
                await tw.logMgr.info('no exception thrown on click');
                return true;
            }, 
            testCases: ['C4567', 'C5678', 'C6789', 'C7890'], 
            description: 'can recover from StaleElementExceptions automatically'
        });
    });
});