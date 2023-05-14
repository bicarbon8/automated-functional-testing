import * as path from "path";
import { aftConfig, rand } from "aft-core";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { assert } from "chai";
import { AftTest } from "aft-mocha-reporter";
import { SeleniumVerifier, verifyWithSelenium } from "aft-ui-selenium";
import { httpService } from "aft-web-services";
import { UiSessionConfig } from "aft-ui";

var customId: string;

describe('Functional Mobile App Tests using AFT-UI-MOBILE-APPS', () => {
    before(async () => {
        const uisc = aftConfig.getSection(UiSessionConfig);
        const auth = `basic ${btoa(`${uisc.options["bstack:options"]?.user}:${uisc.options["bstack:options"]?.key}`)}`
        const resp = await httpService.performRequest({
            url: "https://api-cloud.browserstack.com/app-automate/recent_group_apps",
            headers: {
                "Authorization": auth
            }
        });
        let app: any;
        for (var i=0; i<resp?.["apps"]?.length; i++) {
            let a = resp["apps"][i];
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
            let result: any = await httpService.performRequest({
                url: "https://api-cloud.browserstack.com/app-automate/upload",
                postData: JSON.stringify(data),
                method: 'POST',
                headers: {
                    "Authorization": auth
                }
            });
            customId = result?.custom_id;
        } else {
            customId = app.shareable_id || app.custom_id || app.app_url;
        }
    });

    it('can search in Wikipedia App', async function() {
        const aft = new AftTest(this);
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            this.skip();
        }
        await verifyWithSelenium(async (tw: SeleniumVerifier) => {
            await tw.logMgr.step('get the WikipediaView Facet from the Session...');
            let view: WikipediaView = await tw.getComponent(WikipediaView);
            await tw.logMgr.step('enter a search term...');
            await view.searchFor('pizza');
            await tw.logMgr.step('get the results and ensure they contain the search term...');
            let results: string[] = await view.getResults();
            for (var i=0; i<results.length; i++) {
                let res: string = results[i];
                if (res.toLowerCase().includes('pizza')) {
                    return true;
                }
            }
        }).withAdditionalSessionOptions({
            "bstack:options": {
                "sessionName": aft.logMgr.logName,
                app: customId
            }
        }).internals.usingLogManager(aft.logMgr)
        .returns(true);
    });
});