import { TestCase, TestCaseManager } from 'aft-core';
import { httpService } from 'aft-web-services';
import { TestRailConfig, TestRailTestCasePlugin, TestRailTestCasePluginOptions } from "../../src";
import { TestRailApi } from '../../src/api/testrail-api';
import { TestRailCase, TestRailTest } from '../../src/api/testrail-custom-types';
import { statusConverter } from '../../src/helpers/status-converter';

describe('TestRailTestCasePlugin', () => {
    beforeEach(() => {
        spyOn(httpService, 'performRequest').and.returnValue(Promise.resolve({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        }));
    });

    it('can lookup a test case in an existing plan by case id', async () => {
        const opts: TestRailTestCasePluginOptions = {
            testrailCfg: new TestRailConfig({
                url: 'http://127.0.0.1',
                user: 'fake@fake.fake',
                accesskey: 'fake_key',
                planid: 1234
            })
        };
        opts.testrailApi = new TestRailApi(opts.testrailCfg);
        let expected: TestRailTest = {
            id: 1,
            case_id: 1234,
            priority_id: 2,
            title: 'fake test title',
            run_id: 2,
            status_id: statusConverter.toTestRailStatus('Passed')
        };
        spyOn(opts.testrailApi, 'getTestsInRuns').and.returnValue(Promise.resolve([expected]));
        const plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin(opts);
        
        const actual: TestCase = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe('1');
        expect(actual.status).toBe(statusConverter.fromTestRailStatus(expected.status_id));
        expect(actual.title).toBe(expected.title);
        expect(opts.testrailApi.getTestsInRuns).toHaveBeenCalledTimes(1);
    });

    it('can lookup a test case in a supplied project and suite by case id', async () => {
        const opts: TestRailTestCasePluginOptions = {
            testrailCfg: new TestRailConfig({
                url: 'http://127.0.0.1',
                user: 'fake@fake.fake',
                accesskey: 'fake_key',
                projectid: 4,
                suiteids: [12, 15]
            })
        };
        opts.testrailApi = new TestRailApi(opts.testrailCfg);
        let expected: TestRailCase = {
            id: 1234,
            priority_id: 2,
            title: 'fake test title',
            suite_id: 1122,
            created_on: Date.now()
        } as TestRailCase;
        spyOn(opts.testrailApi, 'getCasesInSuites').and.returnValue(Promise.resolve([expected]));
        let plugin: TestRailTestCasePlugin = new TestRailTestCasePlugin(opts);
        
        let actual: TestCase = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe(`C${expected.id}`);
        expect(actual.status.valueOf()).toBe('Untested');
        expect(actual.title).toBe(expected.title);
        expect(actual.created).toEqual(expected.created_on);
        expect(opts.testrailApi.getCasesInSuites).toHaveBeenCalledTimes(1);
    });

    it('can be loaded by the testcasemanager', async () => {
        const config = {
            plugins: ['testrail-test-case-plugin']
        };
        let mgr: TestCaseManager = new TestCaseManager(config);
        let plugin = await mgr.first();

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('TestRailTestCasePlugin');
    });
});