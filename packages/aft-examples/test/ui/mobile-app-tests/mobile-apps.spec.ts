import * as path from "path";
import * as fs from "fs";
import * as FormData from "form-data";
import { AftConfig, aftConfig } from "aft-core";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { AftTest } from "aft-mocha-reporter";
import { SeleniumVerifier, verifyWithSelenium } from "aft-ui-selenium";
import { httpService, httpData } from "aft-web-services";
import { UiSessionConfig } from "aft-ui";

var customId: string;

describe('Functional Mobile App Tests using AFT-UI-SELENIUM', () => {
    before(async () => {
        const uisc = aftConfig.getSection(UiSessionConfig);
        const auth = `basic ${btoa(`${uisc.options["bstack:options"]?.userName}:${uisc.options["bstack:options"]?.accessKey}`)}`
        const resp = await httpService.performRequest({
            url: "https://api-cloud.browserstack.com/app-automate/recent_group_apps",
            headers: {
                "Authorization": auth
            }
        });
        let app: any;
        const uploadedApps = httpData.as<Array<any>>(resp);
        for (var i=0; i<uploadedApps?.length; i++) {
            let a = uploadedApps[i];
            if (a.app_name == 'WikipediaSample.apk') {
                app = a;
                break;
            }
        }
        if (!app) {
            const formData = new FormData();
            formData.append('custom_id', 'AFT.WikipediaApp');
            formData.append('file', fs.createReadStream(path.join(process.cwd(), './test/ui/mobile-app-tests/mobile-apps/WikipediaSample.apk')));
            const result: any = await httpService.performRequest({
                url: "https://api-cloud.browserstack.com/app-automate/upload",
                postData: formData,
                method: 'POST',
                headers: {
                    "Authorization": auth
                },
                multipart: true
            });
            app = httpData.as<{}>(result);
        }
        customId = app.shareable_id ?? app.custom_id ?? app.app_url;
    });

    it('can search in Wikipedia App', async function() {
        const aftCfg = new AftConfig();
        const aft = new AftTest(this, aftCfg);
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
            capabilities: {
                browserName: 'chrome',
                platformName: 'android',
                "appium:platformVersion": '13.0',
                "appium:deviceName": 'Samsung Galaxy S23',
                "appium:app": customId,
                "bstack:options": {
                    "sessionName": aft.logMgr.logName
                }
            }
        }).internals.usingAftConfig(aftCfg)
        .internals.usingLogManager(aft.logMgr)
        .returns(true);
    });
});