import { TestRailLoggingPlugin } from "../../src/logging/testrail-logging-plugin";
import { rand, LoggingLevel, EllipsisLocation, ITestResult, TestStatus, ellide } from "aft-core";
import { TestRailApi } from "../../src/api/testrail-api";
import { TestRailResultRequest } from "../../src/api/testrail-result-request";
import { TestRailResultResponse } from "../../src/api/testrail-result-response";
import { TestRailConfig } from "../../src/configuration/testrail-config";
import { HttpResponse, HttpService } from "aft-web-services";

describe('TestRailLoggingPlugin', () => {
    beforeEach(() => {
        spyOn(HttpService.instance, 'performRequest').and.returnValue(Promise.resolve(new HttpResponse({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        })));
    });
    
    afterEach(() => {
        TestStore.caseId = undefined;
        TestStore.planId = undefined;
        TestStore.request = undefined;
    });

    it('keeps the last 250 characters logged', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'https://127.0.0.1/', 
            user: 'fake@fake.fake', 
            accesskey: 'fake-key'
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin({
            _config: config, 
            level: 'info', 
            enabled: true,
            maxLogCharacters: 250
        });
        await plugin.onLoad();
        let getLogsSpy = spyOn<any>(plugin, '_getLogs').and.callThrough();

        let expected: string = rand.getString(250, true, true);
        await plugin.log(LoggingLevel.info, expected);

        let actual: string = getLogsSpy.call(plugin);
        expect(actual).toEqual(expected);
    });

    it('logging over 250 characters is ellided from beginning of string', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'https://127.0.0.1/', 
            user: 'fake@fake.fake', 
            accesskey: 'fake-key'
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin({
            _config: config, 
            level: 'info', 
            enabled: true,
            maxLogCharacters: 250
        });
        await plugin.onLoad();
        let getLogsSpy = spyOn<any>(plugin, '_getLogs').and.callThrough();
        
        let notExpected: string = rand.getString(200, true, true);
        let expected: string = rand.getString(250, true, true);
        
        await plugin.log(LoggingLevel.info, notExpected);
        await plugin.log(LoggingLevel.info, expected);

        let actual: string = getLogsSpy.call(plugin);
        expect(actual).toEqual(ellide(`${notExpected}${expected}`, 250, EllipsisLocation.beginning));
    });

    it('converts a Failed result to Retry', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'https://127.0.0.1/', 
            user: 'fake@fake.fake', 
            accesskey: 'fake-key'
        });
        let mockClient: TestRailApi = new TestRailApi(config);
        spyOn(mockClient, 'addResult').and.callFake(async (caseId: string, planId: number, request: TestRailResultRequest): Promise<TestRailResultResponse[]> => {
            TestStore.caseId = caseId;
            TestStore.request = request;
            TestStore.planId = planId;
            return [];
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin({_config: config, _client: mockClient, level: 'info', enabled: true});
        await plugin.onLoad();
        
        let result: ITestResult = {
            testId: 'C' + rand.getInt(99, 999),
            status: TestStatus.Failed,
            resultId: rand.guid,
            created: new Date(),
            metadata: {"durationMs": 1000}
        };
        await plugin.logResult(result);

        expect(mockClient.addResult).toHaveBeenCalledTimes(1);
        expect(TestStore.request.status_id).toEqual(4); // 4 is Retest
        expect(TestStore.caseId).toEqual(result.testId);
        expect(TestStore.planId).toBeDefined();
    });

    it('will not send a result if write not enabled', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'fake.url',
            user: 'fake-user@fake.url',
            accesskey: 'fake-access-key'
        });
        let mockClient: TestRailApi = new TestRailApi(config);
        spyOn(mockClient, 'addResult');
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin({_config: config, _client: mockClient, enabled: false});
        await plugin.onLoad();
        
        let result: ITestResult = {
            testId: 'C' + rand.getInt(99, 999),
            status: TestStatus.Failed,
            resultId: rand.guid,
            created: new Date(),
            metadata: {"durationMs": 1000}
        };
        await plugin.logResult(result);

        expect(mockClient.addResult).not.toHaveBeenCalled();
    });

    /**
     * WARNING: this test is only for local connectivity testing. it will
     * connect to an actual TestRail instance and submit a Retest result.
     * the `url`, `user` and `accesskey` configurations should be set as
     * environment variables on the local system and the `project_id`,
     * `suite_ids` and `ITestResult.testId` should be updated to value values
     */
    xit('sends actual TestResult to TestRail', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: '%testrail_url%', 
            user: '%testrail_user%', 
            accesskey: '%testrail_pass%',
            projectid: 3,
            suiteids: [1219]
        });
        let plugin: TestRailLoggingPlugin = new TestRailLoggingPlugin({_config: config, level: 'trace', enabled: true});
        await plugin.onLoad();
        
        await plugin.log(LoggingLevel.error, rand.getString(100));
        
        let testResult: ITestResult = {
            testId: 'C4663085', // must be an existing TestRail Case ID
            status: TestStatus.Failed,
            resultMessage: rand.getString(100),
            created: new Date(),
            resultId: rand.guid,
            metadata: {"durationMs": 300000}
        };

        await plugin.logResult(testResult);
    }, 300000);
});

module TestStore {
    export var caseId: string;
    export var request: TestRailResultRequest;
    export var planId: number;
}