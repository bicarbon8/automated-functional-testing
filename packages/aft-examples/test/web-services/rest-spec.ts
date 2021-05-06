import { should } from "aft-core";
import { HttpResponse, HttpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async () => {
        let response: HttpResponse;

        await should({expect: async (tw) => {            
            await tw.logMgr.step('making request...');
            response = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});
            expect(response).to.exist;
            await tw.logMgr.info('request completed and received status code: ' + response.statusCode);
            return true;
        }, testCases: ['C2217763']});

        await should({expect: async (tw) => {
            await tw.logMgr.step('confirm response is not null...');
            expect(response).to.exist;
            await tw.logMgr.info('confirmed response is not null.');
            await tw.logMgr.step('confirm response.data is not null...');
            expect(response.data).to.exist;
            await tw.logMgr.info('confirmed response.data is not null.');
            return true;
        }, testCases: ['C3131']});

        await should({expect: async (tw) => {
            await tw.logMgr.step('confirm can deserialise response.data into typed object...');
            let obj: ListUsersResponse = response.dataAs<ListUsersResponse>();
            expect(obj).to.exist;
            await tw.logMgr.info('confirmed can deserialise response.data into typed object.');
            await tw.logMgr.step('confirm object data property contains more than one result...');
            expect(obj.data.length).to.be.greaterThan(0);
            await tw.logMgr.info('confirmed object data property contains more than one result.');
            return true;
        }, testCases: ['C2217764']});
    });
});