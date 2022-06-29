import * as fs from "fs";
import * as path from "path";
import { TestRailApi } from "../../src/api/testrail-api";
import { HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { TestRailConfig, TestRailConfigOptions } from "../../src";
import { TestRailPlan, TestRailPlanEntry } from "../../src/api/testrail-custom-types";

describe('TestRailApi', () => {
    beforeEach(() => {
        const fsmapPath: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(fsmapPath)) {
            fs.rmSync(fsmapPath, {recursive: true, force: true});
        }
    });

    /**
     * NOTE: long running test (takes over 1 minute).
     * Only run when making changes to retry behaviour
     */
    xit('retries on Rate Limit Error response (long running)', async () => {
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = {};
            if (TestStore.count < 1) {
                response.statusCode = 429;
                response.data = '{"error":"API Rate Limit Exceeded"}';
            } else {
                response.statusCode = 200;
                response.data = '{}';
            }
            TestStore.count++;

            return response;
        });

        const opts: TestRailConfigOptions = {
            url: 'http://127.0.0.1/',
            user: 'fake@fake.fake',
            accesskey: 'fake_key'
        };
        let config: TestRailConfig = new TestRailConfig(opts);
        let api: TestRailApi = new TestRailApi({config: config});

        try {
            await api.addResult('C1234', 1234, {});
        } catch (e) {
            /* ignore */
        }

        expect(TestStore.count).toBeGreaterThan(0);
    });

    it('can cache successful responses', async () => {
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let plan = {
                id: 1,
                name: 'fake plan',
                entries: [
                    {
                        suite_id: 2
                    } as TestRailPlanEntry
                ]
            } as TestRailPlan;
            let response: HttpResponse = {
                statusCode: 200,
                headers: {},
                data: JSON.stringify(plan)
            };
            return response;
        });

        const opts: TestRailConfigOptions = {
            url: 'http://127.0.0.1/',
            user: 'fake@fake.fake',
            accesskey: 'fake_key'
        };
        let config: TestRailConfig = new TestRailConfig(opts);
        let api: TestRailApi = new TestRailApi({config: config});
        let plan: TestRailPlan = await api.getPlan(123);

        expect(plan).toBeDefined();
        expect(plan.id).toEqual(1);
        expect(plan.entries).toBeDefined();
        expect(plan.entries.length).toBeGreaterThan(0);
        expect(httpService.performRequest).toHaveBeenCalledTimes(1);

        let cachedResponse: TestRailPlan = await api.getPlan(123);

        expect(cachedResponse).toBeDefined();
        expect(cachedResponse.id).toEqual(1);
        expect(cachedResponse.entries).toBeDefined();
        expect(cachedResponse.entries.length).toBeGreaterThan(0);
        expect(httpService.performRequest).toHaveBeenCalledTimes(1); // no additional call made
    });

    it('will not cache non 200-299 status code responses', async () => {
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = {
                statusCode: 404,
                data: '{}',
                headers: {}
            };
            return response;
        });

        const opts: TestRailConfigOptions = {
            url: 'http://127.0.0.1/',
            user: 'fake@fake.fake',
            accesskey: 'fake_key'
        };
        let config: TestRailConfig = new TestRailConfig(opts);
        let api: TestRailApi = new TestRailApi({config: config});
        let test: any = await api.getPlan(123);

        expect(test).not.toBeNull();
        expect(httpService.performRequest).toHaveBeenCalledTimes(1);

        let nonCachedResponse: any = await api.getPlan(123);

        expect(nonCachedResponse).not.toBeNull();
        expect(httpService.performRequest).toHaveBeenCalledTimes(2); // failure on request so nothing cached
    });

    it('can opt to not cache successful responses', async () => {
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let plan = {
                id: 1,
                name: 'fake plan',
                entries: [
                    {
                        suite_id: 2
                    } as TestRailPlanEntry
                ]
            } as TestRailPlan;
            let response: HttpResponse = {
                statusCode: 200,
                headers: {},
                data: JSON.stringify(plan)
            };
            return response;
        });

        const opts: TestRailConfigOptions = {
            url: 'http://127.0.0.1/',
            user: 'fake@fake.fake',
            accesskey: 'fake_key'
        };
        let config: TestRailConfig = new TestRailConfig(opts);
        let api: TestRailApi = new TestRailApi({config: config});
        let plan: TestRailPlan = await api.createPlan(1, [2, 3]);

        expect(plan).toBeDefined();
        expect(plan.entries.length).toBeGreaterThan(0);
        expect(plan.entries[0].suite_id).toEqual(2);
        expect(httpService.performRequest).toHaveBeenCalledTimes(1);

        let cachedResponse: TestRailPlan = await api.createPlan(1, [2, 3]);

        expect(cachedResponse).toBeDefined();
        expect(cachedResponse.entries.length).toBeGreaterThan(0);
        expect(cachedResponse.entries[0].suite_id).toEqual(2);
        expect(httpService.performRequest).toHaveBeenCalledTimes(2);
    });
});

module TestStore {
    export var count: number = 0;
}