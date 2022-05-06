import { ITestCase, TestStatus, ProcessingResult, TestCaseManager, TestCasePlugin } from 'aft-core';
import { HttpResponse, httpService } from 'aft-web-services';
import { TestRailConfig, TestRailTestCasePlugin } from "../../src";
import { TestRailApi } from '../../src/api/testrail-api';
import { TestRailCase } from '../../src/api/testrail-case';
import { TestRailTest } from '../../src/api/testrail-test';

describe('TestRailTestCasePlugin', () => {
    beforeEach(() => {
        spyOn(httpService, 'performRequest').and.returnValue(Promise.resolve(new HttpResponse({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        })));
    });

    it('can lookup a test case in an existing plan by case id', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'http://127.0.0.1',
            user: 'fake@fake.fake',
            accesskey: 'fake_key',
            planid: 1234
        });
        let api: TestRailApi = new TestRailApi(config);
        let expected: TestRailTest = {
            id: 1,
            case_id: 1234,
            priority_id: 2,
            title: 'fake test title',
            run_id: 2,
            status_id: TestStatus.Passed.valueOf()
        } as TestRailTest;
        spyOn(api, 'getTestsInRuns').and.returnValue(Promise.resolve([expected]));
        let plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin({_config: config, _client: api, enabled: true});
        await plugin.onLoad();

        let actual: ITestCase = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe('1');
        expect(actual.status.valueOf()).toBe(expected.status_id);
        expect(actual.title).toBe(expected.title);
        expect(api.getTestsInRuns).toHaveBeenCalledTimes(1);
    });

    it('can lookup a test case in a supplied project and suite by case id', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'http://127.0.0.1',
            user: 'fake@fake.fake',
            accesskey: 'fake_key',
            projectid: 4,
            suiteids: [12, 15]
        });
        let api: TestRailApi = new TestRailApi(config);
        let expected: TestRailCase = {
            id: 1234,
            priority_id: 2,
            title: 'fake test title',
            suite_id: 1122,
            created_on: new Date().valueOf()
        } as TestRailCase;
        spyOn(api, 'getCasesInSuites').and.returnValue(Promise.resolve([expected]));
        let plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin({_config: config, _client: api, enabled: true});
        await plugin.onLoad();

        let actual: ITestCase = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe(`C${expected.id}`);
        expect(actual.status.valueOf()).toBe(TestStatus.Untested);
        expect(actual.title).toBe(expected.title);
        expect(actual.created).toEqual(new Date(expected.created_on));
        expect(api.getCasesInSuites).toHaveBeenCalledTimes(1);
    });

    it('will skip main processing of functions if not enabled', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'fake.url',
            user: 'fake-user@fake.url',
            accesskey: 'fake-access-key'
        });
        let api: TestRailApi = new TestRailApi(config);
        spyOnAllFunctions(api);
        let plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin({_config: config, _client: api, enabled: false});
        await plugin.onLoad();

        let test: ITestCase = await plugin.getTestCase('C1234');
        let tests: ITestCase[] = await plugin.findTestCases('case_id=1234');

        expect(test).toBeNull();
        expect(tests).toEqual([]);
        expect(api.getRunsInPlan).not.toHaveBeenCalled();
        expect(api.getTestByCaseId).not.toHaveBeenCalled();
        expect(api.getTestsInRuns).not.toHaveBeenCalled();
        expect(api.getCasesInSuites).not.toHaveBeenCalled();
    });

    it('will return true for shouldRun if read not enabled', async () => {
        let config: TestRailConfig = new TestRailConfig({
            url: 'fake.url',
            user: 'fake-user@fake.url',
            accesskey: 'fake-access-key'
        });
        let api: TestRailApi = new TestRailApi(config);
        spyOnAllFunctions(api);
        let plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin({_config: config, _client: api, enabled: false});
        await plugin.onLoad();

        let shouldRun: ProcessingResult = await plugin.shouldRun('C1234');

        expect(shouldRun.success).toBe(true);
        expect(api.getRunsInPlan).not.toHaveBeenCalled();
        expect(api.getTestByCaseId).not.toHaveBeenCalled();
        expect(api.getTestsInRuns).not.toHaveBeenCalled();
        expect(api.getCasesInSuites).not.toHaveBeenCalled();
    });

    it('can be loaded by the testcasepluginmanager', async () => {
        let mgr: TestCaseManager = new TestCaseManager({
            pluginNames: ['testrail-test-case-plugin'],
            searchDir: './dist'
        });
        let plugin: TestCasePlugin = await mgr.getFirstEnabledPlugin();

        expect(plugin).toBeDefined();
        expect(plugin instanceof TestRailTestCasePlugin).toBeTrue();
    });
});