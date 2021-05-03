import { should } from "aft-core";
import { HttpResponse, HttpService } from 'aft-web-services';
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    beforeAll(() => {
        jasmine.DEFAULT_TIMEOUT_INTERVAL = 60000;
    });

    it('can make GET request from JSON REST API', async () => {
        let response: HttpResponse;

        await should({expect: async (tw) => {            
            await tw.logMgr.step('making request...');
            response = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});
            let result: boolean = expect(response).toBeDefined();
            await tw.logMgr.info('request completed and received status code: ' + response.statusCode);
            return result;
        }, testCases: ['C2217763']});

        await should({expect: async (tw) => {
            let result: boolean = true;
            await tw.logMgr.step('confirm response is not null...');
            result = result && expect(response).toBeDefined()
            await tw.logMgr.info('confirmed response is not null.');
            await tw.logMgr.step('confirm response.data is not null...');
            result = result && expect(response.data).toBeDefined()
            await tw.logMgr.info('confirmed response.data is not null.');
            return result;
        }, testCases: ['C3131']});

        await should({expect: async (tw) => {
            let result: boolean = true;
            await tw.logMgr.step('confirm can deserialise response.data into typed object...');
            let obj: ListUsersResponse = response.dataAs<ListUsersResponse>();
            result = result && expect(obj).toBeDefined();
            await tw.logMgr.info('confirmed can deserialise response.data into typed object.');
            await tw.logMgr.step('confirm object data property contains more than one result...');
            result = result && expect(obj.data.length).toBeGreaterThan(0);
            await tw.logMgr.info('confirmed object data property contains more than one result.');
            return result;
        }, testCases: ['C2217764']});
    });
});