import * as fs from "fs";
import * as path from "path";
import { rand, TestResult, ellide, ReportingManager, AftConfig, pluginLoader } from "aft-core";
import { TestRailApi } from "../../src/api/testrail-api";
import { httpService } from "aft-web-services";
import { TestRailPlan, TestRailResult, TestRailResultRequest, TestRailTest } from "../../src/api/testrail-custom-types";
import { TestRailReportingPlugin } from "../../src";

describe('TestRailReportingPlugin', () => {
    beforeEach(() => {
        spyOn(httpService, 'performRequest').and.returnValue(Promise.resolve({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        }));
        const cachePath: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(cachePath)) {
            fs.rmSync(cachePath, {recursive: true, force: true});
        }
        pluginLoader.reset();
    });
    
    afterEach(() => {
        TestStore.caseId = undefined;
        TestStore.planId = undefined;
        TestStore.request = undefined;
        pluginLoader.reset();
    });

    it('keeps the last 250 characters logged', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key',
                logLevel: 'info',
                maxLogCharacters: 250
            }
        });
        const plugin: TestRailReportingPlugin = new TestRailReportingPlugin(aftCfg);

        const message: string = rand.getString(250, true, true);
        const name = 'keeps the last 250 characters logged';
        await plugin.log({name, level: 'info', message});

        const actual: string = plugin.logs(name);
        expect(actual).toEqual(message);
    });

    it('logging over 250 characters is ellided from beginning of string', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key',
                logLevel: 'info',
                maxLogCharacters: 250
            }
        });
        let plugin: TestRailReportingPlugin = new TestRailReportingPlugin(aftCfg);
        let notExpected: string = rand.getString(200, true, true);
        let expected: string = rand.getString(250, true, true);
        
        const name = rand.getString(60);
        await plugin.log({name, level: 'info', message: notExpected});
        await plugin.log({name, level: 'info', message: expected});

        let actual: string = plugin.logs(name);
        expect(actual).toEqual(ellide(`${notExpected}${expected}`, 250, 'beginning'));
    });

    it('converts a Failed result to Retry', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key',
                logLevel: 'info',
                planId: rand.getInt(999, 9999)
            }
        });
        const api = new TestRailApi(aftCfg);
        spyOn(api, 'addResult').and.callFake(async (caseId: string, planId: number, request: TestRailResultRequest): Promise<TestRailResult[]> => {
            TestStore.caseId = caseId;
            TestStore.request = request;
            TestStore.planId = planId;
            return [];
        });
        let plugin: TestRailReportingPlugin = new TestRailReportingPlugin(aftCfg, api);
        
        let result: TestResult = {
            testName: 'converts a Failed result to Retry',
            testId: 'C' + rand.getInt(99, 999),
            status: 'failed',
            resultId: rand.guid,
            created: Date.now(),
            metadata: {"durationMs": 1000}
        };
        await plugin.submitResult(result);

        expect(api.addResult).toHaveBeenCalledTimes(1);
        expect(TestStore.request.status_id).toEqual(4); // 4 is Retest
        expect(TestStore.caseId).toEqual(result.testId);
        expect(TestStore.planId).toBeDefined();
    });

    it('creates a new TestRail plan in a shared FileSystemMap if none exists', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key',
                projectid: 3,
                suiteids: [12, 15],
                logLevel: 'info'
            }
        });
        const api = new TestRailApi(aftCfg);
        const planId: number = rand.getInt(1000, 10000);
        spyOn(api, 'createPlan').and.callFake(async (projectId: number, suiteIds: number[], name?: string): Promise<TestRailPlan> => {
            return {id: planId};
        });
        spyOn(api, 'getTestByCaseId').and.callFake(async (caseId: string, planId: number): Promise<TestRailTest> => {
            return {
                id: rand.getInt(1000, 10000)
            };
        });
        let plugin: TestRailReportingPlugin = new TestRailReportingPlugin(aftCfg, api);
        
        let result: TestResult = {
            testName: 'creates a new TestRail plan in a shared FileSystemMap if none exists',
            testId: 'C' + rand.getInt(99, 999),
            status: 'failed',
            resultId: rand.guid,
            created: Date.now(),
            metadata: {"durationMs": 1000}
        };
        await plugin.submitResult(result);

        expect(api.createPlan).toHaveBeenCalledTimes(1);
        const sharedCacheFile: string = path.join(process.cwd(), 'FileSystemMap', 'TestRailConfig.json');
        expect(fs.existsSync(sharedCacheFile)).toBeTrue();
    });

    it('can be loaded by the ReportingManager', async () => {
        const aftCfg = new AftConfig({
            plugins: ['testrail-reporting-plugin']
        });
        const mgr: ReportingManager = new ReportingManager('can be loaded by the ReportingManager', aftCfg);
        const plugin = mgr.plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('TestRailReportingPlugin');
    });

    /**
     * WARNING: this test is only for local connectivity testing. it will
     * connect to an actual TestRail instance and submit a Retest result.
     * the `url`, `user` and `accesskey` configurations should be set as
     * environment variables on the local system and the `project_id`,
     * `suite_ids` and `ITestResult.testId` should be updated to value values
     */
    xit('sends actual TestResult to TestRail', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: '%testrail_url%', 
                user: '%testrail_user%', 
                accesskey: '%testrail_pass%',
                projectid: 3,
                suiteids: [1219],
                logLevel: 'trace'
            }
        });
        let plugin: TestRailReportingPlugin = new TestRailReportingPlugin(aftCfg);
        
        const name = 'sends actual TestResult to TestRail';
        await plugin.log({name, level: 'error', message: rand.getString(100)});
        
        let testResult: TestResult = {
            testName: name,
            testId: 'C4663085', // must be an existing TestRail Case ID
            status: 'failed',
            resultMessage: rand.getString(100),
            created: Date.now(),
            resultId: rand.guid,
            metadata: {"durationMs": 300000}
        };

        await plugin.submitResult(testResult);
    }, 300000);
});

module TestStore {
    export var caseId: string;
    export var request: TestRailResultRequest;
    export var planId: number;
}