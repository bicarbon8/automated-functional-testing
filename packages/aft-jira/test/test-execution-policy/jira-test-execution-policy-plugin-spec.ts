import * as fs from 'fs';
import * as path from 'path';
import { TestExecutionPolicyManager, AftConfig } from 'aft-core';
import { httpService } from 'aft-web-services';
import { JiraTestExecutionPolicyPlugin } from "../../src";
import { JiraApi } from '../../src/api/jira-api';
import {  } from '../../src/api/jira-custom-types';

describe('JiraApiTestExecutionPolicyPlugin', () => {
    beforeEach(() => {
        spyOn(httpService, 'performRequest').and.returnValue(Promise.resolve({
            headers: {'content-type': 'application/json'},
            statusCode: 200,
            data: '{}'
        }));
        const file = path.join(process.cwd(), 'FileSystemMap', 'JiraApi.json');
        if (fs.existsSync(file)) {
            fs.unlinkSync(file);
        }
    });

    it('can lookup a test case in an existing plan by case id', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'http://127.0.0.1',
                user: 'fake@fake.fake',
                accesskey: 'fake_key',
                planid: 1234
            }
        });
        const api = new JiraApi(aftCfg);
        let expected: TestRailTest = {
            id: 1,
            case_id: 1234,
            priority_id: 2,
            title: 'fake test title',
            run_id: 2,
            status_id: statusConverter.toTestRailStatus('passed')
        };
        spyOn(api, 'getTestsInRuns').and.returnValue(Promise.resolve([expected]));
        const plugin: JiraTestExecutionPolicyPlugin = new JiraTestExecutionPolicyPlugin(aftCfg, api);
        
        const actual: TestRailTest = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe(1);
        expect(actual.status_id).toBe(expected.status_id);
        expect(actual.title).toBe(expected.title);
        expect(api.getTestsInRuns).toHaveBeenCalledTimes(1);
    });

    it('can lookup a test case in a supplied project and suite by case id', async () => {
        const aftCfg = new AftConfig({
            TestRailConfig: {
                url: 'http://127.0.0.1',
                user: 'fake@fake.fake',
                accesskey: 'fake_key',
                projectid: 4,
                suiteids: [12, 15],
                logLevel: 'none'
            }
        });
        const api = new JiraApi(aftCfg);
        let expected: TestRailCase = {
            id: 1234,
            priority_id: 2,
            title: 'fake test title',
            suite_id: 1122,
            created_on: Date.now()
        } as TestRailCase;
        spyOn(api, 'getCasesInSuites').and.returnValue(Promise.resolve([expected]));
        let plugin: JiraTestExecutionPolicyPlugin = new JiraTestExecutionPolicyPlugin(aftCfg, api);
        
        let actual: TestRailCase = await plugin.getTestCase('C1234');

        expect(actual).toBeDefined();
        expect(actual.id).toBe(expected.id);
        expect(actual.title).toBe(expected.title);
        expect(actual.created_on).toEqual(expected.created_on);
        expect(api.getCasesInSuites).toHaveBeenCalledTimes(1);
    });

    it('can be loaded by the testcasemanager', async () => {
        const aftCfg = new AftConfig({
            pluginNames: ['testrail-test-execution-policy-plugin']
        });
        let mgr: TestExecutionPolicyManager = new TestExecutionPolicyManager(aftCfg);
        let plugin = await mgr.plugins[0];

        expect(plugin).toBeDefined();
        expect(plugin.constructor.name).toEqual('JiraApiTestExecutionPolicyPlugin');
    });
});