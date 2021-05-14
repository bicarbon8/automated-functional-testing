import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { should, TestWrapper } from "aft-core";
import { HttpResponse, HttpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async () => {
        let response: HttpResponse;

        await should({expectation: async (tw) => {            
            await tw.logMgr.step('making request...');
            response = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});
            expect(response).to.exist;
            await tw.logMgr.info('request completed and received status code: ' + response.statusCode);
            return true;
        }, testCases: ['C2217763']});

        await should({expectation: async (tw) => {
            await tw.logMgr.step('confirm response is not null...');
            expect(response).to.exist;
            await tw.logMgr.info('confirmed response is not null.');
            await tw.logMgr.step('confirm response.data is not null...');
            expect(response.data).to.exist;
            await tw.logMgr.info('confirmed response.data is not null.');
            return true;
        }, testCases: ['C3131']});

        await should({expectation: async (tw) => {
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

    it('can make a multipart post', async () => {
        await should({description: 'can make a multipart post',
            expectation: async (tw: TestWrapper) => {
                let formData = new FormData();
                formData.append('file', fs.createReadStream(path.join(process.cwd(), 'LICENSE')));
                await tw.logMgr.step('about to send multipart post...');
                let resp: HttpResponse = await HttpService.instance.performRequest({
                    multipart: true,
                    url: 'https://httpbin.org/post',
                    postData: formData,
                    method: 'POST'
                });
                await tw.logMgr.info(`received response of ${resp.data}`);
                expect(resp).to.not.be.undefined;
                expect(resp.data).to.not.be.undefined;
                return true;
            }
        });
    });
});