import { ITestCase, TestCasePlugin, TestCasePluginOptions, ProcessingResult, TestStatus } from 'aft-core';
import { TestRailApi } from '../api/testrail-api';
import { TestRailCase } from '../api/testrail-case';
import { TestRailRun } from '../api/testrail-run';
import { TestRailTest } from '../api/testrail-test';
import { TestRailConfig, trconfig } from '../configuration/testrail-config';
import { StatusConverter } from '../helpers/status-converter';

export interface TestRailTestCasePluginOptions extends TestCasePluginOptions {
    _config?: TestRailConfig;
    _client?: TestRailApi;
}

/**
 * NOTE: this plugin references configuration from the `aftconfig.json` file
 * under a name of `testrailtestcaseplugin`. Ex:
 * ```json
 * {
 *   "testrailtestcaseplugin": {
 *     "enabled": false
 *   }
 * }
 * ```
 */
export class TestRailTestCasePlugin extends TestCasePlugin {
    private _config: TestRailConfig;
    private _client: TestRailApi;

    constructor(options?: TestRailTestCasePluginOptions) {
        super(options);
        this._config = options?._config || trconfig;
        this._client = options?._client || new TestRailApi(this._config);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getTestCase(caseId: string): Promise<ITestCase> {
        if (await this.enabled()) {
            if (caseId && caseId.startsWith('C')) {
                caseId = caseId.replace('C', '');
            }
            let planId: number = await this._config.getPlanId();
            let searchTerm: string = `case_id=${caseId}`;
            if (planId <= 0) {
                searchTerm = `id=${caseId}`;
            }
            let tests: ITestCase[] = await this.findTestCases(searchTerm);
            if (tests && tests.length > 0) {
                return tests[0];
            }
        }
        return null;
    }

    /**
     * the `searchTerm` must take the format of `key=value` where the `key` is a valid
     * field on a `TestRailTest` or `TestRailCase` object and the `value` is the expected
     * value to be found for said `key`
     * @param searchTerm a string containing a key and a value to be used to locate tests
     */
    async findTestCases(searchTerm: string): Promise<ITestCase[]> {
        if (await this.enabled()) {
            if (searchTerm) {
                let keyVal: string[] = searchTerm.split('=');
                if (keyVal && keyVal.length > 1) {
                    let key: string = keyVal[0];
                    let val: string = keyVal[1];
                    return await this._findTestsByField(key, val);
                }
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
    async shouldRun(caseId: string): Promise<ProcessingResult> {
        if (await this.enabled()) {
            let test: ITestCase = await this.getTestCase(caseId);
            if (test) {
                if (test.status != TestStatus.Passed) {
                    return {success: true, obj: test};
                }
                return {success: false, obj: test, message: 'test already marked as passed so do not run again'};
            }
            return {success: false, obj: test, message: `no test with case id: '${caseId}' could be found in the supplied Plan or Suites`};
        }
        return {success: true, message: 'plugin disabled so run all tests'};
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }

    private async _findTestsByField(field: string, val: string): Promise<ITestCase[]> {
        let planId: number = await this._config.getPlanId();
        let tests: ITestCase[] = [];
        if (planId > 0) {
            // look for test in plan
            let trRuns: TestRailRun[] = await this._client.getRunsInPlan(planId);
            let runIds: number[] = [];
            trRuns.forEach((r) => {
                runIds.push(r.id);
            });
            let trTests: TestRailTest[] = await this._client.getTestsInRuns(runIds);
            for (var i=0; i<trTests.length; i++) {
                let trTest: TestRailTest = trTests[i];
                if (trTest && trTest.hasOwnProperty(field) && trTest[field]?.toString() == val) {
                    tests.push(this._createITestCaseFromTest(trTest));
                }
            }
        } else {
            // look for case in suites
            let projectId: number = await this._config.getProjectId();
            let suiteIds: number[] = await this._config.getSuiteIds();
            let trCases: TestRailCase[] = await this._client.getCasesInSuites(projectId, suiteIds);
            for (var i=0; i<trCases.length; i++) {
                let trCase: TestRailCase = trCases[i];
                if (trCase && trCase.hasOwnProperty(field) && trCase[field]?.toString() == val) {
                    tests.push(this._createITestCaseFromCase(trCase));
                }
            }
        }
        return tests;
    }

    private _createITestCaseFromTest(trTest: TestRailTest): ITestCase {
        return {
            id: trTest.id?.toString(),
            title: trTest.title,
            status: StatusConverter.instance.fromTestRailStatus(trTest.status_id)
        };
    }

    private _createITestCaseFromCase(trCase: TestRailCase): ITestCase {
        return {
            id: `C${trCase.id}`,
            title: trCase.title,
            status: TestStatus.Untested,
            created: new Date(trCase.created_on)
        };
    }
}