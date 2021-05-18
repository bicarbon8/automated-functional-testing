import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { Verifier, verify } from "aft-core";
import { HttpResponse, HttpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async () => {
        let response: HttpResponse;

        await verify(async (tw) => {            
            await tw.logMgr.step('making request...');
            response = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});
            expect(response).to.exist;
            await tw.logMgr.info('request completed and received status code: ' + response.statusCode);
            return response.statusCode;
        }).withTests('C2217763').returns(200);

        await verify(async (tw) => {
            await tw.logMgr.step('confirm response is not null...');
            expect(response).to.exist;
            await tw.logMgr.info('confirmed response is not null.');
            await tw.logMgr.step('confirm response.data is not null...');
            expect(response.data).to.exist;
            await tw.logMgr.info('confirmed response.data is not null.');
        }).withTests('C3131');

        await verify(async (tw) => {
            await tw.logMgr.step('confirm can deserialise response.data into typed object...');
            let obj: ListUsersResponse = response.dataAs<ListUsersResponse>();
            expect(obj).to.exist;
            await tw.logMgr.info('confirmed can deserialise response.data into typed object.');
            await tw.logMgr.step('confirm object data property contains more than one result...');
            expect(obj.data.length).to.be.greaterThan(0);
            await tw.logMgr.info('confirmed object data property contains more than one result.');
        }).withTests('C2217764');
    });

    it('can make a multipart post', async () => {
        await verify(async (tw: Verifier) => {
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
        }).withDescription('can make a multipart post');
    });
});