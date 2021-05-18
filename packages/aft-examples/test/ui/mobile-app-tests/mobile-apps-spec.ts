import * as path from "path";
import { rand } from "aft-core";
import { MobileAppSessionGeneratorPluginManager, MobileAppVerifier, verifyWithMobileApp } from "aft-ui-mobile-apps";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { assert } from "chai";

var customId: string;

describe('Functional Mobile App Tests using AFT-UI-MOBILE-APPS', () => {
    before(async () => {
        let mgr = MobileAppSessionGeneratorPluginManager.instance();
        let resp = await mgr.sendCommand('getApps');
        let app: any;
        for (var i=0; i<resp?.apps?.length; i++) {
            let a = resp.apps[i];
            if (a.app_name == 'WikipediaSample.apk') {
                app = a;
                break;
            }
        }
        if (!app) {
            let data = {
                file: path.join(process.cwd(), './test/ui/mobile-app-tests/mobile-apps/WikipediaSample.apk'),
                custom_id: rand.getString(15)
            };
            let result: any = await mgr.sendCommand('upload', data);
            customId = result.custom_id;
        } else {
            customId = app.shareable_id || app.custom_id || app.app_url;
        }
    });

    it('can search in Wikipedia App', async () => {
        await verifyWithMobileApp(async (tw: MobileAppVerifier) => {
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
            assert(contains);
        }).withMobileAppSessionOptions({app: customId})
        .and.withDescription('can search in Wikipedia App');
    });
});