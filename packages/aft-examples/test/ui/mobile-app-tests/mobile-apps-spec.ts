import * as path from "path";
import { rand } from "aft-core";
import { mobileAppShould, MobileAppTestWrapper, MobileAppSessionGeneratorPluginManager, BrowserStackMobileAppUploadCommand, BrowserStackMobileAppUploadResponse, BrowserStackMobileAppGetAppsResponse, BrowserStackMobileApp } from "aft-ui-mobile-apps";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { expect } from "chai";

var customId: string;

describe('Functional Mobile App Tests using AFT-UI-MOBILE-APPS', () => {
    before(async () => {
        let mgr = MobileAppSessionGeneratorPluginManager.instance();
        let resp = await mgr.sendCommand({
            commandType: 'getApps'
        }) as BrowserStackMobileAppGetAppsResponse;
        let app: BrowserStackMobileApp;
        for (var i=0; i<resp?.apps?.length; i++) {
            let a = resp.apps[i];
            if (a.app_name == 'WikipediaSample.apk') {
                app = a;
                break;
            }
        }
        if (!app) {
            let command: BrowserStackMobileAppUploadCommand = {
                commandType: 'upload',
                file: path.join(process.cwd(), './test/ui/mobile-app-tests/mobile-apps/WikipediaSample.apk'),
                custom_id: rand.getString(15)
            };
            let result: BrowserStackMobileAppUploadResponse = await mgr.sendCommand(command) as BrowserStackMobileAppUploadResponse;
            customId = result.custom_id;
        } else {
            customId = app.custom_id || app.app_url;
        }
    });

    it('can search in Wikipedia App', async () => {
        await mobileAppShould({ description: 'can search in Wikipedia App',
            remoteOptions: {
                logLevel: 'silent',
                capabilities: {"app": customId}
            },
            expect: async (tw: MobileAppTestWrapper) => {
                await tw.logMgr.step('get the WikipediaView Facet from the Session...');
                let view: WikipediaView = await tw.session.getFacet(WikipediaView);
                await tw.logMgr.step('enter a search term...');
                await view.searchFor('pizza');
                await tw.logMgr.step('get the results and ensure they contain the search term...');
                let results: string[] = await view.getResults();
                let contains: boolean = false;
                for (var i=0; i<results.length; i++) {
                    let res: string = results[i];
                    if (res.toLowerCase().includes('pizza')) {
                        contains = true;
                        break;
                    }
                }
                expect(contains).to.be.true;
            }
        });
    });
});