import * as path from "path";
import * as fs from "fs";
import * as FormData from "form-data";
import { ReportingManager, aftConfig, containing, using } from "aft-core";
import { WikipediaView } from "../lib/page-objects/mobile-app/wikipedia-view";
import { aftMochaTest, AftMochaTest } from "aft-mocha-reporter";
import { httpService, httpData, HttpHeaders } from "aft-web-services";
import { UiSessionConfig } from "aft-ui";
import { WebdriverIoSession } from "aft-ui-webdriverio";

let customId: string;

describe('Functional Mobile App Tests using WebdriverIO and Mocha', () => {
    before(async () => {
        const logger = new ReportingManager('MobileAppsSpec Before');
        const uisc = aftConfig.getSection(UiSessionConfig);
        const username = uisc.options?.user;
        const password = uisc.options?.key;
        const resp = await httpService.performRequest({
            url: "https://api-cloud.browserstack.com/app-automate/recent_group_apps",
            headers: {
                ...HttpHeaders.Authorization.basic(username, password)
            },
            reporter: logger
        });
        let app: any;
        const uploadedApps = httpData.as<Array<any>>(resp);
        if (Array.isArray(uploadedApps)) {
            for (const a of uploadedApps) {
                if (a.app_name === 'WikipediaSample.apk') {
                    app = a;
                    break;
                }
            }
        }
        if (!app) {
            const formData = new FormData();
            formData.append('custom_id', 'AFT.WikipediaApp');
            formData.append('file', fs.createReadStream(path.join(process.cwd(), './lib/mobile-apps/WikipediaSample.apk')));
            const result: any = await httpService.performRequest({
                url: "https://api-cloud.browserstack.com/app-automate/upload",
                postData: formData,
                method: 'POST',
                headers: {
                    ...HttpHeaders.Authorization.basic(username, password)
                },
                multipart: true,
                reporter: logger
            });
            app = httpData.as<{}>(result);
        }
        customId = app.shareable_id ?? app.custom_id ?? app.app_url ?? 'AFT.WikipediaApp';
    });

    it('can search in Wikipedia App [C5432]', async function() {
        await aftMochaTest(this, async (v: AftMochaTest) => {
            let res = new Array<string>();
            await using(new WebdriverIoSession({
                aftConfig: v.aftCfg,
                reporter: v.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'android',
                        platformName: 'android',
                        "appium:platformVersion": '13.0',
                        "appium:deviceName": 'Samsung Galaxy S23',
                        "appium:app": customId,
                        "bstack:options": {
                            "sessionName": v.reporter.name,
                            buildName: await v.buildInfoManager.get(),
                            "osVersion": null
                        }
                    }
                }
            }), async (session: WebdriverIoSession) => {
                await session.reporter.step('get the WikipediaView Component from the Session...');
                const view: WikipediaView = await session.getComponent(WikipediaView);
                await session.reporter.step('enter a search term...');
                await view.searchFor('pizza');
                await session.reporter.step('get the results and ensure they contain the search term...');
                const results: string[] = await view.getResults();
                res = results.map(r => r?.toLocaleLowerCase());
            });
            await v.verify(res, containing('pizza'));
        });
    });
});
