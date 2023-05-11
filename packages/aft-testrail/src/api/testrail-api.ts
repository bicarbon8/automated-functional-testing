import { httpData, HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { aftConfig, AftConfig, CacheMap, convert, ExpiringFileLock, fileio, JsonObject, wait } from "aft-core";
import { TestRailConfig } from "../configuration/testrail-config";
import { AddPlanRequest, ICanHaveError, TestRailCase, TestRailGetCasesResponse, TestRailGetTestsResponse, TestRailPlan, TestRailPlanEntry, TestRailResult, TestRailResultRequest, TestRailResultResponse, TestRailRun, TestRailTest } from "./testrail-custom-types";

export class TestRailApi {
    private readonly _aftCfg: AftConfig;
    private readonly _cache: CacheMap<string, any>;
    
    constructor(aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._cache = new CacheMap<string, any>(this.config.cacheDuration, true, this.constructor.name);
    }

    get config(): TestRailConfig {
        return this._aftCfg.getSection(TestRailConfig);
    }

    /**
     * submits the passed in `result` for the specified `caseId` if a matching test is
     * found
     * @param caseId the test identifier to be used to find a test id to add the result to
     * @param result the `TestRailResultRequest` to be added
     */
    async addResult(caseId: string, planId: number, result: TestRailResultRequest): Promise<TestRailResult[]> {
        let test: TestRailTest = await this.getTestByCaseId(caseId, planId);
        let path: string = `/api/v2/add_result/${test.id}`;

        let res: TestRailResultResponse = await this._post<TestRailResultResponse>(path, JSON.stringify(result));
        let results: TestRailResult[] = res?.results || [];

        while (res?._links?.next) {
            res = await this._get<TestRailResultResponse>(res._links.next, true);
            if (res?.results?.length) {
                for (var i=0; i<res.results.length; i++) {
                    results.push(res.results[i]);
                }
            }
        }

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
        const allCases: TestRailCase[] = [];
        const path: string = `/api/v2/get_cases/${projectId}&suite_id=`;
        for (var i=0; i<suiteIds.length; i++) {
            let res: TestRailGetCasesResponse = await this._get<TestRailGetCasesResponse>(path + suiteIds[i], true);
            if (res?.cases?.length) {
                for (var j=0; j<res.cases.length; j++) {
                    allCases.push(res.cases[j]);
                }
            }
            while (res?._links?.next) {
                res = await this._get<TestRailGetCasesResponse>(res._links.next, true);
                if (res?.cases?.length) {
                    for (var j=0; j<res.cases.length; j++) {
                        allCases.push(res.cases[j]);
                    }
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
        const allTests: TestRailTest[] = [];
        const path: string = '/api/v2/get_tests/';

        for (var i=0; i<runIds.length; i++) {
            let res: TestRailGetTestsResponse = await this._get<TestRailGetTestsResponse>(path + runIds[i], true);
            if (res?.tests?.length) {
                for (var j=0; j<res.tests.length; j++) {
                    allTests.push(res.tests[j]);
                }
            }
            while (res?._links?.next) {
                res = await this._get<TestRailGetTestsResponse>(res._links.next, true);
                if (res?.tests?.length) {
                    for (var j=0; j<res.tests.length; j++) {
                        allTests.push(res.tests[j]);
                    }
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
        if (plan?.entries?.length) {
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
        let path: string = `/api/v2/get_plan/${planId}`;
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
        let path: string = `/api/v2/add_plan/${projectId}`;
        let plan: TestRailPlan = await this._post<TestRailPlan>(path, JSON.stringify(addPlan));

        return plan;
    }

    private async _get<T extends JsonObject>(path: string, cacheResponse: boolean): Promise<T> {
        let apiUrl: string = await this._getApiUrl();
        let request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'GET',
            headers: {}
        };
        let data: T = this._cache.get(request.url);
        if (!data) {
            let response: HttpResponse = await this._performRequestWithRateLimitHandling(request);
            data = httpData.as<T>(response);
            if (cacheResponse && response.statusCode >= 200 && response.statusCode <= 299) {
                this._cache.set(request.url, data);
            }
        }

        return data;
    }

    private async _post<T extends JsonObject>(path: string, data: string): Promise<T> {
        let apiUrl: string = await this._getApiUrl();
        let request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'POST',
            postData: data,
            headers: {}
        };

        let response: HttpResponse = await this._performRequestWithRateLimitHandling(request);

        return httpData.as<T>(response);
    }

    private async _getApiUrl(): Promise<string> {
        let url = this.config.url;
        if (url && !url.endsWith('/')) {
            url += '/';
        }
        return `${url}index.php?`;
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
                err = httpData.as<ICanHaveError>(response);
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
        let username: string = this.config.user;
        let accessKey: string = this.config.accessKey;
        return convert.toBase64Encoded(`${username}:${accessKey}`);
    }
}