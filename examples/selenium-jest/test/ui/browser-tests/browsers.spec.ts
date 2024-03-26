import { BuildInfoManager, containing, retry } from "aft-core";
import { AftTest } from "aft-jest-reporter";
import { SeleniumVerifier } from "aft-ui-selenium";
import { HerokuLoginPage } from "./page-objects/heroku-login-page";

describe('Functional Browser Tests using AFT-UI-SELENIUM', () => {
    test('[C3456][C2345][C1234] can access websites using AFT and BrowserComponents', async () => {
        const aft = new AftTest(expect);
        await aft.verify(async (tw: SeleniumVerifier) => {
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
        }, SeleniumVerifier).withAdditionalSessionOptions({
            capabilities: {
                browserName: 'chrome',
                "bstack:options": {
                    sessionName: aft.reporter.reporterName,
                    buildName: await new BuildInfoManager().get()
                }
            }
        }).returns(containing("You logged into a secure area!"));
    });
});