import * as path from "path";
import { rand } from "aft-core";
import { mobileAppShould, MobileAppTestWrapper, MobileAppSessionGeneratorPluginManager, BrowserStackMobileAppUploadCommand, BrowserStackMobileAppUploadResponse } from "aft-ui-mobile-apps";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { expect } from "chai";

var customId: string;

describe('Functional Mobile App Tests using AFT-UI-MOBILE-APPS', () => {
    before(async () => {
        let command: BrowserStackMobileAppUploadCommand = {
            commandType: 'upload',
            file: path.join(process.cwd(), './test/ui/mobile-app-tests/mobile-apps/WikipediaSample.apk'),
            custom_id: rand.getString(15)
        };
        let result: BrowserStackMobileAppUploadResponse = await MobileAppSessionGeneratorPluginManager.instance().sendCommand(command) as BrowserStackMobileAppUploadResponse;
        customId = result.custom_id;
    });

    it('can search in Wikipedia App', async () => {
        await mobileAppShould({ description: 'can search in Wikipedia App',
            app: customId,
            expect: async (tw: MobileAppTestWrapper) => {
                let view: WikipediaView = await tw.session.getFacet(WikipediaView, {locator: '//*'});
                await view.searchFor('pizza');
                let results: string[] = await view.getResults();
                return expect(results).to.contain('pizza');
            }
        });
    });
});