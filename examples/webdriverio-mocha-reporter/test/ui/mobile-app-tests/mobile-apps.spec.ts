import * as path from "path";
import * as fs from "fs";
import * as FormData from "form-data";
import { BuildInfoManager, Reporter, aftConfig, buildInfo, using } from "aft-core";
import { WikipediaView } from "./page-objects/wikipedia-view";
import { AftTest } from "aft-mocha-reporter";
import { httpService, httpData, HttpHeaders } from "aft-web-services";
import { UiSessionConfig } from "aft-ui";
import { WebdriverIoSession } from "aft-ui-webdriverio";
import { expect } from "chai";

let customId: string;

describe('Functional Mobile App Tests using AFT-UI-WEBDRIVERIO', () => {
    before(async () => {
        const logger = new Reporter('MobileAppsSpec Before');
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
        for (let i=0; i<uploadedApps?.length; i++) {
            const a = uploadedApps[i];
            if (a.app_name === 'WikipediaSample.apk') {
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
                    ...HttpHeaders.Authorization.basic(username, password)
                },
                multipart: true,
                reporter: logger
            });
            app = httpData.as<{}>(result);
        }
        customId = app.shareable_id ?? app.custom_id ?? app.app_url ?? 'AFT.WikipediaApp';
    });

    it('can search in Wikipedia App', async function() {
        const aft = new AftTest(this);
        if (!(await aft.shouldRun())) {
            await aft.pending();
        } else {
            await using(new WebdriverIoSession({
                aftConfig: aft.aftCfg,
                reporter: aft.reporter,
                additionalSessionOptions: {
                    capabilities: {
                        browserName: 'android',
                        platformName: 'android',
                        "appium:platformVersion": '13.0',
                        "appium:deviceName": 'Samsung Galaxy S23',
                        "appium:app": customId,
                        "bstack:options": {
                            "sessionName": aft.reporter.reporterName,
                            buildName: await buildInfo.get()
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
                let result: boolean;
                for (const res of results) {
                    if (res.toLowerCase().includes('pizza')) {
                        result = true;
                        break;
                    }
                }
                expect(result).to.eql(true);
            });
        }
    });
});
