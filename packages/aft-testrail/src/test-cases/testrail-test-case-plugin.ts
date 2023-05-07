import { TestCase, TestCasePlugin, AftLog, Merge, TestCasePluginOptions } from 'aft-core';
import { TestRailApi } from '../api/testrail-api';
import { TestRailCase, TestRailRun, TestRailTest } from '../api/testrail-custom-types';
import { TestRailConfig, trconfig } from '../configuration/testrail-config';
import { statusConverter } from '../helpers/status-converter';

export type TestRailTestCasePluginOptions = Merge<TestCasePluginOptions, {
    config?: TestRailConfig;
    api?: TestRailApi;
    logMgr?: AftLog;
}>;

/**
 * NOTE: this plugin has no configuration options as they are
 * all retrieved from `TestRailConfig` under the `TestRailConfig`
 * section of your `aftconfig.json` file
 */
export class TestRailTestCasePlugin extends TestCasePlugin<TestRailTestCasePluginOptions> {
    private _trConfig: TestRailConfig;
    private _api: TestRailApi;
    private _logMgr: AftLog;

    get config(): TestRailConfig {
        if (!this._trConfig) {
            this._trConfig = this.option('config') || trconfig;
        }
        return this._trConfig;
    }

    get api(): TestRailApi {
        if (!this._api) {
            this._api = this.option('api') || new TestRailApi({config: this.config});
        }
        return this._api;
    }

    get logMgr(): AftLog {
        if (!this._logMgr) {
            this._logMgr = this.option('logMgr') || new AftLog({logName: this.constructor.name});
        }
        return this._logMgr;
    }

    override async getTestCase(caseId: string): Promise<TestCase> {
        if (caseId && caseId.startsWith('C')) {
            caseId = caseId.replace('C', '');
        }
        let planId: number = await this.config.planId();
        let searchTerm: string = `case_id=${caseId}`;
        if (planId <= 0) {
            searchTerm = `id=${caseId}`;
        }
        let tests: TestCase[] = await this.findTestCases(searchTerm);
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
    override async findTestCases(searchTerm: string): Promise<TestCase[]> {
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
    override async shouldRun(caseId: string): Promise<boolean> {
        let test: TestCase = await this.getTestCase(caseId);
        if (test) {
            if (test.status != 'Passed') {
                return true;
            }
            await this.logMgr.trace(`test '${caseId}' already marked as passed so do not run again`);
            return false;
        }
        await this.logMgr.trace(`no test with case id: '${caseId}' could be found in the supplied Plan or Suites`);
        return false;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }

    private async _findTestsByField(field: string, val: string): Promise<TestCase[]> {
        let planId: number = await this.config.planId();
        let tests: TestCase[] = [];
        if (planId > 0) {
            // look for test in plan
            let trRuns: TestRailRun[] = await this.api.getRunsInPlan(planId);
            let runIds: number[] = [];
            trRuns.forEach((r) => {
                runIds.push(r.id);
            });
            let trTests: TestRailTest[] = await this.api.getTestsInRuns(runIds);
            for (var i=0; i<trTests.length; i++) {
                let trTest: TestRailTest = trTests[i];
                if (trTest && trTest.hasOwnProperty(field) && trTest[field]?.toString() == val) {
                    tests.push(this._createTestCaseFromTest(trTest));
                }
            }
        } else {
            // look for case in suites
            let projectId: number = await this.config.projectId();
            let suiteIds: number[] = await this.config.suiteIds();
            let trCases: TestRailCase[] = await this.api.getCasesInSuites(projectId, suiteIds);
            for (var i=0; i<trCases.length; i++) {
                let trCase: TestRailCase = trCases[i];
                if (trCase && trCase.hasOwnProperty(field) && trCase[field]?.toString() == val) {
                    tests.push(this._createTestCaseFromCase(trCase));
                }
            }
        }
        return tests;
    }

    private _createTestCaseFromTest(trTest: TestRailTest): TestCase {
        return {
            id: trTest.id?.toString(),
            title: trTest.title,
            status: statusConverter.fromTestRailStatus(trTest.status_id)
        };
    }

    private _createTestCaseFromCase(trCase: TestRailCase): TestCase {
        return {
            id: `C${trCase.id}`,
            title: trCase.title,
            status: 'Untested',
            created: trCase.created_on
        };
    }
}