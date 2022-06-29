import * as fs from "fs";
import * as path from "path";
import { TestRailLoggingPlugin, TestRailLoggingPluginOptions } from "../../src/logging/testrail-logging-plugin";
import { rand, TestResult, ellide, LogManager } from "aft-core";
import { TestRailApi } from "../../src/api/testrail-api";
import { TestRailConfig } from "../../src/configuration/testrail-config";
import { httpService } from "aft-web-services";
import { TestRailPlan, TestRailResult, TestRailResultRequest, TestRailTest } from "../../src/api/testrail-custom-types";

describe('TestRailLoggingPlugin', () => {
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
    });
    
    afterEach(() => {
        TestStore.caseId = undefined;
        TestStore.planId = undefined;
        TestStore.request = undefined;
    });

    it('keeps the last 250 characters logged', async () => {
        const opts: TestRailLoggingPluginOptions = {
            level: 'info',
            maxLogCharacters: 250,
            config: new TestRailConfig({
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key'
            })
        };
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);

        let expected: string = rand.getString(250, true, true);
        const logName = 'keeps the last 250 characters logged';
        await plugin.log({level: 'info', message: expected, name: logName});

        let actual: string = plugin.logs(logName);
        expect(actual).toEqual(expected);
    });

    it('removes logs for a given logName on call to dispose', async () => {
        const opts: TestRailLoggingPluginOptions = {
            level: 'info',
            maxLogCharacters: 250,
            config: new TestRailConfig({
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key'
            })
        };
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);

        let expected: string = rand.getString(250, true, true);
        const logName = rand.getString(15);
        
        await plugin.log({level: 'info', message: expected, name: logName});

        let actual: string = plugin.logs(logName);
        expect(actual).toEqual(expected);

        await plugin.dispose(logName);
        actual = plugin.logs(logName);
        expect(actual).toEqual('');
    });

    it('logging over 250 characters is ellided from beginning of string', async () => {
        const opts: TestRailLoggingPluginOptions = {
            level: 'info',
            maxLogCharacters: 250,
            config: new TestRailConfig({
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key'
            })
        };
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);
        let notExpected: string = rand.getString(200, true, true);
        let expected: string = rand.getString(250, true, true);
        
        const logName = rand.getString(60);
        await plugin.log({level: 'info', message: notExpected, name: logName});
        await plugin.log({level: 'info', message: expected, name: logName});

        let actual: string = plugin.logs(logName);
        expect(actual).toEqual(ellide(`${notExpected}${expected}`, 250, 'beginning'));
    });

    it('converts a Failed result to Retry', async () => {
        const opts: TestRailLoggingPluginOptions = {
            level: 'info',
            config: new TestRailConfig({
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key'
            })
        };
        opts.api = new TestRailApi({config: opts.config});
        spyOn(opts.api, 'addResult').and.callFake(async (caseId: string, planId: number, request: TestRailResultRequest): Promise<TestRailResult[]> => {
            TestStore.caseId = caseId;
            TestStore.request = request;
            TestStore.planId = planId;
            return [];
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);
        
        let result: TestResult = {
            testId: 'C' + rand.getInt(99, 999),
            status: 'Failed',
            resultId: rand.guid,
            created: Date.now(),
            metadata: {"durationMs": 1000}
        };
        await plugin.logResult('converts a Failed result to Retry', result);

        expect(opts.api.addResult).toHaveBeenCalledTimes(1);
        expect(TestStore.request.status_id).toEqual(4); // 4 is Retest
        expect(TestStore.caseId).toEqual(result.testId);
        expect(TestStore.planId).toBeDefined();
    });

    it('creates a new TestRail plan in a shared FileSystemMap if none exists', async () => {
        const opts: TestRailLoggingPluginOptions = {
            level: 'info',
            config: new TestRailConfig({
                url: 'https://127.0.0.1/', 
                user: 'fake@fake.fake', 
                accesskey: 'fake-key',
                projectid: 3,
                suiteids: [12, 15]
            })
        };
        opts.api = new TestRailApi({config: opts.config});
        const planId: number = rand.getInt(1000, 10000);
        spyOn(opts.api, 'createPlan').and.callFake(async (projectId: number, suiteIds: number[], name?: string): Promise<TestRailPlan> => {
            return {id: planId};
        });
        spyOn(opts.api, 'getTestByCaseId').and.callFake(async (caseId: string, planId: number): Promise<TestRailTest> => {
            return {
                id: rand.getInt(1000, 10000)
            };
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);
        
        let result: TestResult = {
            testId: 'C' + rand.getInt(99, 999),
            status: 'Failed',
            resultId: rand.guid,
            created: Date.now(),
            metadata: {"durationMs": 1000}
        };
        await plugin.logResult('creates a new TestRail plan in a shared FileSystemMap if none exists', result);

        expect(opts.api.createPlan).toHaveBeenCalledTimes(1);
        const sharedCacheFile: string = path.join(process.cwd(), 'FileSystemMap', 'TestRailConfig.json');
        expect(fs.existsSync(sharedCacheFile)).toBeTrue();
    });

    it('can be loaded by the LogManager', async () => {
        const conf = {
            logName: 'can be loaded by the LogManager',
            plugins: ['testrail-logging-plugin']
        };
        let mgr: LogManager = new LogManager(conf);
        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('TestRailLoggingPlugin');
    });

    /**
     * WARNING: this test is only for local connectivity testing. it will
     * connect to an actual TestRail instance and submit a Retest result.
     * the `url`, `user` and `accesskey` configurations should be set as
     * environment variables on the local system and the `project_id`,
     * `suite_ids` and `ITestResult.testId` should be updated to value values
     */
    xit('sends actual TestResult to TestRail', async () => {
        const opts: TestRailLoggingPluginOptions = {
            config: new TestRailConfig({
                url: '%testrail_url%', 
                user: '%testrail_user%', 
                accesskey: '%testrail_pass%',
                projectid: 3,
                suiteids: [1219]
            }),
            level: 'trace'
        };
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin(opts);
        
        const logName = 'sends actual TestResult to TestRail';
        await plugin.log({level: 'error', message: rand.getString(100), name: logName});
        
        let testResult: TestResult = {
            testId: 'C4663085', // must be an existing TestRail Case ID
            status: 'Failed',
            resultMessage: rand.getString(100),
            created: Date.now(),
            resultId: rand.guid,
            metadata: {"durationMs": 300000}
        };

        await plugin.logResult(logName, testResult);
    }, 300000);
});

module TestStore {
    export var caseId: string;
    export var request: TestRailResultRequest;
    export var planId: number;
}