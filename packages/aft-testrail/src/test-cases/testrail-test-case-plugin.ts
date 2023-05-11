import { AftConfig, LogManagerConfig, PolicyEnginePlugin, ProcessingResult } from 'aft-core';
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
export class TestRailTestCasePlugin extends PolicyEnginePlugin {
    public override readonly enabled: boolean;
    
    private readonly _api: TestRailApi;

    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(TestRailConfig);
        this.enabled = cfg.policyEngineEnabled ?? true;
        if (this.enabled) {
            this._api = new TestRailApi(this.aftCfg);
        }
    }

    private async _getTestCase(caseId: string): Promise<TestRailCase> {
        if (caseId && caseId.startsWith('C')) {
            caseId = caseId.replace('C', '');
        }
        let searchTerm: string;
        // if logging enabled then use TestRail Plan
        if (this.aftCfg.getSection(TestRailConfig).logLevel != 'none') {
            searchTerm = `case_id=${caseId}`;
        } else {
            // use Project and Suite IDs
            searchTerm = `id=${caseId}`;
        }
        const tests: Array<TestRailCase> = await this._findTestCases(searchTerm);
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
    private async _findTestCases(searchTerm: string): Promise<TestRailCase[]> {
        if (searchTerm) {
            let keyVal: string[] = searchTerm.split('=');
            if (keyVal && keyVal.length > 1) {
                let key: string = keyVal[0];
                let val: string = keyVal[1];
                return await this._findTestsByField(key, val);
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
            let test: TestRailCase = await this._getTestCase(caseId);
            if (test) {
                if (test['status_id']) {
                    if (statusConverter.fromTestRailStatus(test['status_id']) != 'passed') {
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
        let tests = new Array<TestRailCase | TestRailTest>();
        if ((cfg.logLevel ?? this.aftCfg.getSection(LogManagerConfig).logLevel ?? 'warn') !== 'none') {
            // look for TestRailTests in TestRail Plan
            let planId: number = await PlanId.get(this.aftCfg, this._api);
            let trRuns: TestRailRun[] = await this._api.getRunsInPlan(planId);
            let runIds: number[] = [];
            trRuns.forEach((r) => {
                runIds.push(r.id);
            });
            let trTests: TestRailTest[] = await this._api.getTestsInRuns(runIds);
            for (var i=0; i<trTests.length; i++) {
                let trTest: TestRailTest = trTests[i];
                if (trTest && trTest.hasOwnProperty(field) && trTest[field]?.toString() == val) {
                    tests.push(trTest);
                }
            }
        } else {
            // look for TestRailCases in Project and Suites
            let projectId: number = cfg.projectId;
            let suiteIds: number[] = cfg.suiteIds ?? [];
            let trCases: TestRailCase[] = await this._api.getCasesInSuites(projectId, suiteIds);
            for (var i=0; i<trCases.length; i++) {
                let trCase: TestRailCase = trCases[i];
                if (trCase && trCase.hasOwnProperty(field) && trCase[field]?.toString() == val) {
                    tests.push(trCase);
                }
            }
        }
        return tests;
    }
}