import * as fs from 'fs';
import * as path from 'path';
import { TestExecutionPolicyManager, AftConfig, rand, ProcessingResult } from 'aft-core';
import { httpService } from 'aft-web-services';
import { JiraTestExecutionPolicyPlugin } from "../../src";
import { JiraApi } from '../../src/api/jira-api';
import { JiraFields, JiraIssue } from '../../src/api/jira-custom-types';

describe('JiraTestExecutionPolicyPlugin', () => {
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

    describe('shouldRun', () => {
        it('returns false if any open defects found', async () => {
            const aftCfg = new AftConfig({
                JiraConfig: {
                    url: 'http://127.0.0.1',
                    accesskey: 'fake_key',
                    policyEngineEnabled: true
                }
            });
            const api = new JiraApi(aftCfg);
            const expected: Array<JiraIssue> = new Array({
                id: `${rand.getInt(99, 999)}`,
                key: `${rand.getString(4, true, false, false, false)}-${rand.getString(4, false, true, false, false)}`,
                fields: {
                    created: new Date().toISOString(),
                    comment: rand.getString(100),
                    description: rand.getString(100)
                } as JiraFields
            } as JiraIssue);
            spyOn(api, 'searchIssues').and.returnValue(Promise.resolve(expected));
            const plugin: JiraTestExecutionPolicyPlugin = new JiraTestExecutionPolicyPlugin(aftCfg, api);
            
            const actual: ProcessingResult<boolean> = await plugin.shouldRun('C1234');

            expect(actual).toBeDefined();
            expect(actual.result).toBe(false);
            expect(actual.message).toContain('C1234');
            expect(actual.message).toContain(expected[0].key);
            expect(api.searchIssues).toHaveBeenCalledTimes(1);
        });

        it('returns true if no open defects found', async () => {
            const aftCfg = new AftConfig({
                JiraConfig: {
                    url: 'http://127.0.0.1',
                    accesskey: 'fake_key',
                    policyEngineEnabled: true
                }
            });
            const api = new JiraApi(aftCfg);
            const expected: Array<JiraIssue> = [];
            spyOn(api, 'searchIssues').and.returnValue(Promise.resolve(expected));
            const plugin: JiraTestExecutionPolicyPlugin = new JiraTestExecutionPolicyPlugin(aftCfg, api);
            
            const actual: ProcessingResult<boolean> = await plugin.shouldRun('C1234');

            expect(actual).toBeDefined();
            expect(actual.result).toBe(true);
            expect(actual.message).toContain('C1234');
            expect(actual.message).not.toMatch(/.*([a-zA-Z]{4}-[0-9]{4}).*/);
            expect(api.searchIssues).toHaveBeenCalledTimes(1);
        });

        it('returns true if plugin is not enabled', async () => {
            const aftCfg = new AftConfig({
                JiraConfig: {
                    url: 'http://127.0.0.1',
                    accesskey: 'fake_key',
                    policyEngineEnabled: false
                }
            });
            const api = new JiraApi(aftCfg);
            const expected: Array<JiraIssue> = [];
            spyOn(api, 'searchIssues').and.returnValue(Promise.resolve(expected));
            const plugin: JiraTestExecutionPolicyPlugin = new JiraTestExecutionPolicyPlugin(aftCfg, api);
            
            const actual: ProcessingResult<boolean> = await plugin.shouldRun('C1234');

            expect(actual).toBeDefined();
            expect(actual.result).toBe(true);
            expect(actual.message).not.toBeDefined();
            expect(api.searchIssues).not.toHaveBeenCalled();
        });

        it('can be loaded by the testcasemanager', async () => {
            const aftCfg = new AftConfig({
                plugins: ['jira-test-execution-policy-plugin']
            });
            let mgr: TestExecutionPolicyManager = new TestExecutionPolicyManager(aftCfg);
            let plugin = mgr.plugins[0];

            expect(plugin).toBeDefined();
            expect(plugin.constructor.name).toEqual('JiraTestExecutionPolicyPlugin');
        });
    });
});