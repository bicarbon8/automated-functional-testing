import { HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { convert, wait } from "aft-core";
import { TestRailCase } from "./testrail-case";
import { TestRailCache } from "./testrail-cache";
import { TestRailTest } from "./testrail-test";
import { TestRailRun } from "./testrail-run";
import { TestRailResultRequest } from "./testrail-result-request";
import { TestRailResultResponse } from "./testrail-result-response";
import { TestRailPlan } from "./testrail-plan";
import { ICanHaveError } from "./ican-have-error";
import { AddPlanRequest } from "./add-plan-request";
import { TestRailPlanEntry } from "./testrail-plan-entry";
import { TestRailConfig, trconfig } from "../configuration/testrail-config";

export class TestRailApi {
    private _config: TestRailConfig;
    
    constructor(config?: TestRailConfig) {
        this._config = config || trconfig;
    }

    /**
     * submits the passed in `result` for the specified `caseId` if a matching test is
     * found
     * @param caseId the test identifier to be used to find a test id to add the result to
     * @param result the `TestRailResultRequest` to be added
     */
    async addResult(caseId: string, planId: number, result: TestRailResultRequest): Promise<TestRailResultResponse[]> {
        let test: TestRailTest = await this.getTestByCaseId(caseId, planId);
        let path: string = `add_result/${test.id}`;

        let results: TestRailResultResponse[] = await this._post<TestRailResultResponse[]>(path, JSON.stringify(result));

        return results;
    }

    /**
     * returns the test (found in a run and can have a result) for a given case (found in 
     * a suite and cannot have a result)
     * @param caseId the id found in a designated suite for which a test should be found
     */
    async getTestByCaseId(caseId: string, planId: number): Promise<TestRailTest> {
        let runs: TestRailRun[] = await this.getRunsInPlan(planId);
        let runIds: number[] = [];
        let test: TestRailTest = null;
        for (var i=0; i<runs.length; i++) {
            runIds.push(runs[i].id);
        }
        let tests: TestRailTest[] = await this.getTestsInRuns(runIds);
        for (var i=0; i<tests.length; i++) {
            if (`C${tests[i].case_id}` == caseId) {
                test = tests[i];
                break;
            }
        }
        return test;
    }

    /**
     * returns all the TestRail cases in the designated `suite_ids`. unlike
     * tests, which are in a test run, these cannot have a result
     */
    async getCasesInSuites(projectId: number, suiteIds: number[]): Promise<TestRailCase[]> {
        let allCases: TestRailCase[] = [];
        let path: string = `get_cases/${projectId}&suite_id=`;
        for (var i=0; i<suiteIds.length; i++) {
            let cases: TestRailCase[] = await this._get<TestRailCase[]>(path + suiteIds[i], true);
            if (cases) {
                for (var j=0; j<cases.length; j++) {
                    allCases.push(cases[j]);
                }
            }
        }

        return allCases;
    }

    /**
     * returns all the tests in a given set of test runs (suites)
     * @param runIds the ids of each run in a designated `plan_id`
     */
    async getTestsInRuns(runIds: number[]): Promise<TestRailTest[]> {
        let allTests: TestRailTest[] = [];
        let path: string = 'get_tests/';

        for (var i=0; i<runIds.length; i++) {
            let tests: TestRailTest[] = await this._get<TestRailTest[]>(path + runIds[i], true);
            if (tests) {
                for (var j=0; j<tests.length; j++) {
                    allTests.push(tests[j]);
                }
            }
        }

        return allTests;
    }

    /**
     * gets all the runs (suites) included in the designated
     * test plan
     */
    async getRunsInPlan(planId: number): Promise<TestRailRun[]> {
        let plan: TestRailPlan = await this.getPlan(planId);
        let runs: TestRailRun[] = [];
        if (plan && plan.entries) {
            for (var i=0; i<plan.entries.length; i++) {
                for (var j=0; j<plan.entries[i].runs.length; j++) {
                    runs.push(plan.entries[i].runs[j]);
                }
            }
        }
        return runs;
    }

    /**
     * gets the designated test plan by `plan_id`
     */
    async getPlan(planId: number): Promise<TestRailPlan> {
        let plan: TestRailPlan;
        let path: string = `get_plan/${planId}`;
        plan = await this._get<TestRailPlan>(path, true);
        return plan;
    }

    /**
     * creates a new Test Plan in the designated `project_id` using
     * the designated `suite_ids` to create a test run for each suite
     * @param name [OPTIONAL] name to use for the newly created plan
     */
    async createPlan(projectId: number, suiteIds: number[], name?: string): Promise<TestRailPlan> {
        if (!name) {
            name = `Automation - ${new Date().toUTCString()}`;
        }
        let addPlan: AddPlanRequest = {
            name: name,
            entries: []
        };
        for (var i=0; i<suiteIds.length; i++) {
            let entry: TestRailPlanEntry = {
                suite_id: suiteIds[i],
                include_all: true
            };
            addPlan.entries.push(entry);
        }
        let path: string = `add_plan/${projectId}`;
        let plan: TestRailPlan = await this._post<TestRailPlan>(path, JSON.stringify(addPlan));

        return plan;
    }

    private async _get<T>(path: string, cacheResponse: boolean): Promise<T> {
        let apiUrl: string = await this._getApiUrl();
        let request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'GET',
            headers: {}
        };
        let data: T = await TestRailCache.instance.get<T>(request.url);
        if (!data) {
            let response: HttpResponse = await this._performRequestWithRateLimitHandling(request);
            data = response.dataAs<T>();
            if (cacheResponse && response.statusCode >= 200 && response.statusCode <= 299) {
                await TestRailCache.instance.set(request.url, data);
            }
        }

        return data;
    }

    private async _post<T>(path: string, data: string): Promise<T> {
        let apiUrl: string = await this._getApiUrl();
        let request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'POST',
            postData: data,
            headers: {}
        };

        let response: HttpResponse = await this._performRequestWithRateLimitHandling(request);

        return response.dataAs<T>();
    }

    private async _getApiUrl(): Promise<string> {
        let url = await this._config.getUrl();
        if (url && !url.endsWith('/')) {
            url += '/';
        }
        return `${url}index.php?/api/v2/`;
    }

    private async _performRequestWithRateLimitHandling(request: HttpRequest): Promise<HttpResponse> {
        request.headers['Authorization'] = `Basic ${await this._getAuth()}`;
        request.headers['Content-Type'] = 'application/json';
        let retry: boolean;
        let response: HttpResponse;

        do { // allow retries on API Rate Limit Exceeded
            retry = false;
            response = await httpService.performRequest(request);
            let err: ICanHaveError;
            try {
                err = response.dataAs<ICanHaveError>();
            } catch (e) {
                /* ignore */
            }
            if (err && err.error) {
                if (err.error.includes('API Rate Limit Exceeded')) {
                    retry = true;
                    await wait.forDuration(60000); // one minute
                } else {
                    return Promise.reject(err.error);
                }
            }
        } while (retry);

        return response;
    }

    private async _getAuth(): Promise<string> {
        let username: string = await this._config.getUser();
        let accessKey: string = await this._config.getAccessKey();
        return convert.toBase64Encoded(`${username}:${accessKey}`);
    }
}