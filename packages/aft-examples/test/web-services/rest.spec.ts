import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { Verifier, greaterThan, havingValue, lessThan, retry } from "aft-core";
import { AftTest } from "aft-mocha-reporter";
import { httpData, HttpResponse, httpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async function() {
        const aft = new AftTest(this);
        let response: HttpResponse;
        await aft.verify(async (v: Verifier) => {            
            await v.logMgr.step('making request...');
            const r = retry(() => httpService.performRequest({
                url: 'https://reqres.in/api/users?page=2',
                logMgr: v.logMgr
            })).until((res: HttpResponse) => res.statusCode >= 200 && res.statusCode < 400)
            .withDelay(100)
            .withBackOff('exponential')
            .withMaxDuration(20000);

            response = await Promise.resolve(r);
            if (!r.isSuccessful) {
                await v.logMgr.error(r.lastError);
            }
            return r.totalDuration;
        }).withDescription('takes less than 10sec')
        .and.withTestIds('C2217763')
        .returns(lessThan(10000));

        await aft.verify(async (v: Verifier) => {
            await v.logMgr.step('confirm response is not null...');
            expect(response).to.exist;
            await v.logMgr.info('confirmed response is not null.');
            await v.logMgr.info('response status code: ' + response.statusCode);
            await v.logMgr.step('confirm response.data is not null...');
            return response.data;
        }).withDescription('returns a valid response object')
        .and.withTestIds('C3131')
        .returns(havingValue());

        await aft.verify(async (v: Verifier) => {
            await v.logMgr.step('confirm can deserialise response.data into typed object...');
            let obj: ListUsersResponse = httpData.as<ListUsersResponse>(response);
            expect(obj).to.exist;
            await v.logMgr.info('confirmed can deserialise response.data into typed object.');
            await v.logMgr.step('confirm object data property contains more than one result...');
            return obj.data.length;
        }).withDescription('receives more than 0 results in the data array')
        .and.withTestIds('C2217764')
        .returns(greaterThan(0));
    });

    it('can make a multipart post', async function() {
        const aft = new AftTest(this);
        await aft.verify(async (v: Verifier) => {
            let formData = new FormData();
            formData.append('file', fs.createReadStream(path.join(process.cwd(), 'LICENSE')));
            await v.logMgr.step('about to send multipart post...');
            const resp = await httpService.performRequest({
                multipart: true,
                url: 'https://httpbin.org/post',
                postData: formData,
                method: 'POST',
                logMgr: v.logMgr
            });

            if (resp) {
                await v.logMgr.info(`received response.`);
            }
            return resp.data;
        }).returns(havingValue())
    });
});