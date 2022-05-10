import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { between, greaterThan, havingValue, Verifier, verify } from "aft-core";
import { HttpResponse, httpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async () => {
        await verify(async (v) => {
            let response: HttpResponse;
            await verify(async (tw) => {            
                await tw.logMgr.step('making request...');
                response = await httpService.performRequest({url: 'https://reqres.in/api/users?page=2'});
                expect(response).to.exist;
                await tw.logMgr.info('request completed and received status code: ' + response.statusCode);
                return response.statusCode;
            }).withLogManager(v.logMgr)
            .and.withTestId('C2217763')
            .returns(between(200, 399));

            await verify(async (tw) => {
                await tw.logMgr.step('confirm response is not null...');
                expect(response).to.exist;
                await tw.logMgr.info('confirmed response is not null.');
                await tw.logMgr.step('confirm response.data is not null...');
                return response.data;
            }).withLogManager(v.logMgr)
            .and.withTestId('C3131')
            .returns(havingValue());

            await verify(async (tw) => {
                await tw.logMgr.step('confirm can deserialise response.data into typed object...');
                let obj: ListUsersResponse = response.dataAs<ListUsersResponse>();
                expect(obj).to.exist;
                await tw.logMgr.info('confirmed can deserialise response.data into typed object.');
                await tw.logMgr.step('confirm object data property contains more than one result...');
                return obj.data.length;
            }).withLogManager(v.logMgr)
            .and.withTestId('C2217764')
            .returns(greaterThan(0));
        }).withDescription('can make GET request from JSON REST API');
    });

    it('can make a multipart post', async () => {
        await verify(async (tw: Verifier) => {
            let formData = new FormData();
            formData.append('file', fs.createReadStream(path.join(process.cwd(), 'LICENSE')));
            await tw.logMgr.step('about to send multipart post...');
            let resp: HttpResponse = await httpService.performRequest({
                multipart: true,
                url: 'https://httpbin.org/post',
                postData: formData,
                method: 'POST'
            });
            await tw.logMgr.info(`received response of ${resp.data}`);
            expect(resp).to.not.be.undefined;
            return resp.data;
        }).withDescription('can make a multipart post')
        .returns(havingValue());
    });
});