import { AftConfig, PolicyPlugin, ProcessingResult } from 'aft-core';
import { TestRailApi } from '../api/testrail-api';
import { TestRailCase, TestRailRun, TestRailTest } from '../api/testrail-custom-types';
import { TestRailConfig } from '../configuration/testrail-config';
import { statusConverter } from '../helpers/status-converter';
import { PlanId } from '../helpers/plan-id';

/**
 * NOTE: this plugin has no configuration options as they are
 * all retrieved from `TestRailConfig` under the `TestRailConfig`
 * section of your `aftconfig.json` file
 */
export class TestRailPolicyPlugin extends PolicyPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    
    private readonly _api: TestRailApi;

    constructor(aftCfg?: AftConfig, api?: TestRailApi) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(TestRailConfig);
        this._enabled = cfg.policyEngineEnabled ?? true;
        if (this.enabled) {
            this._api = api ?? new TestRailApi(this.aftCfg);
        }
    }

    async getTestCase(caseId: string): Promise<TestRailCase | TestRailTest> {
        if (caseId && caseId.startsWith('C')) {
            caseId = caseId.replace('C', '');
        }
        let searchTerm: string;
        // if logging enabled then use TestRail Plan
        if (this.aftCfg.getSection(TestRailConfig).logLevel !== 'none') {
            searchTerm = `case_id=${caseId}`;
        } else {
            // use Project and Suite IDs
            searchTerm = `id=${caseId}`;
        }
        const tests: Array<TestRailCase | TestRailTest> = await this.findTestCases(searchTerm);
        if (tests && tests.length > 0) {
            return tests[0];
        }
        return null;
    }

    /**
     * the `searchTerm` must take the format of `key=value` where the `key` is a valid
     * field on a `TestRailTest` or `TestRailCase` object and the `value` is the expected
     * value to be found for said `key`
     * @param searchTerm a string containing a key and a value to be used to locate tests
     */
    async findTestCases(searchTerm: string): Promise<Array<TestRailCase | TestRailTest>> {
        if (searchTerm) {
            const keyVal: string[] = searchTerm.split('=');
            if (keyVal && keyVal.length > 1) {
                const key: string = keyVal[0];
                const val: string = keyVal[1];
                return this._findTestsByField(key, val);
            }
        }
        return [];
    }

    /**
     * function will find a TestRail test or case by case id and if found
     * will return true if the test is not already marked as passed. if
     * no test is found then false is returned
     * @param caseId the TestRail case id used to lookup either a test in an
     * existing plan or a case in an existing suite
     */
    override shouldRun = async (caseId: string): Promise<ProcessingResult<boolean>> => {
        if (this.enabled) {
            const cfg = this.aftCfg.getSection(TestRailConfig);
            const test: TestRailCase = await this.getTestCase(caseId);
            if (test) {
                if (test['status_id']) {
                    if (statusConverter.fromTestRailStatus(test['status_id']) !== 'passed') {
                        return {result: true, message: `'${caseId}' results found, but none of them were passing so re-run`};
                    }
                    return {result: false, message: `'${caseId}' results found and already marked as passing`};
                }
                return {result: true, message: `'${caseId}' exists in project: '${cfg.projectId}', suites: [${cfg.suiteIds.join(', ')}]`};
            }
            return {result: false, message: `'${caseId}' not found in project: '${cfg.projectId}', suites: [${cfg.suiteIds.join(', ')}]`};
        }
        return {result: true};
    }

    private async _findTestsByField(field: string, val: string): Promise<Array<TestRailCase | TestRailTest>> {
        const cfg = this.aftCfg.getSection(TestRailConfig);
        const tests = new Array<TestRailCase | TestRailTest>();
        if ((cfg.logLevel ?? this.aftCfg.logLevel ?? 'warn') !== 'none') {
            // look for TestRailTests in TestRail Plan
            const planId: number = await PlanId.get(this.aftCfg, this._api);
            const trRuns: TestRailRun[] = await this._api.getRunsInPlan(planId);
            const runIds: number[] = [];
            trRuns.forEach((r) => {
                runIds.push(r.id);
            });
            const trTests: TestRailTest[] = await this._api.getTestsInRuns(runIds);
            for (const trTest of trTests) {
                if (trTest?.[field]?.toString() === val) {
                    tests.push(trTest);
                }
            }
        } else {
            // look for TestRailCases in Project and Suites
            const projectId: number = cfg.projectId;
            const suiteIds: number[] = cfg.suiteIds ?? [];
            const trCases: TestRailCase[] = await this._api.getCasesInSuites(projectId, suiteIds);
            for (const trCase of trCases) {
                if (trCase?.[field]?.toString() === val) {
                    tests.push(trCase);
                }
            }
        }
        return tests;
    }
}