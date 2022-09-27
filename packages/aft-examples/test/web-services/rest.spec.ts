import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { greaterThan, havingValue, lessThan, retry, verify } from "aft-core";
import { AftLog, AftTest } from "aft-mocha-reporter";
import { httpData, HttpResponse, httpService } from 'aft-web-services';
import { expect } from "chai";
import { ListUsersResponse } from "./response-objects/list-users-response";

describe('REST Request', () => {
    it('can make GET request from JSON REST API', async function() {
        const aft = new AftLog(this);
        let response: HttpResponse;
        await verify(async (tw) => {            
            await tw.logMgr.step('making request...');
            const r = retry(() => httpService.performRequest({
                url: 'https://reqres.in/api/users?page=2',
                logMgr: tw.logMgr
            })).until((res: HttpResponse) => res.statusCode >= 200 && res.statusCode < 400)
            .withStartDelayBetweenAttempts(100)
            .withBackOff('exponential')
            .withMaxDuration(20000);

            response = await Promise.resolve(r);
            if (!r.isSuccessful) {
                await tw.logMgr.error(r.lastError);
            }
            return r.totalDuration;
        }).withLogManager(aft.logMgr)
        .and.withDescription('takes less than 10sec')
        .and.withTestIds('C2217763')
        .returns(lessThan(10000));

        await verify(async (tw) => {
            await tw.logMgr.step('confirm response is not null...');
            expect(response).to.exist;
            await tw.logMgr.info('confirmed response is not null.');
            await tw.logMgr.info('response status code: ' + response.statusCode);
            await tw.logMgr.step('confirm response.data is not null...');
            return response.data;
        }).withLogManager(aft.logMgr)
        .and.withDescription('returns a valid response object')
        .and.withTestIds('C3131')
        .returns(havingValue());

        await verify(async (tw) => {
            await tw.logMgr.step('confirm can deserialise response.data into typed object...');
            let obj: ListUsersResponse = httpData.as<ListUsersResponse>(response);
            expect(obj).to.exist;
            await tw.logMgr.info('confirmed can deserialise response.data into typed object.');
            await tw.logMgr.step('confirm object data property contains more than one result...');
            return obj.data.length;
        }).withLogManager(aft.logMgr)
        .and.withDescription('receives more than 0 results in the data array')
        .and.withTestIds('C2217764')
        .returns(greaterThan(0));
    });

    it('can make a multipart post', async function() {
        const aft = new AftTest(this);
        const shouldRun = await aft.shouldRun();
        if (!shouldRun) {
            aft.test.skip();
        }
        
        let formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(process.cwd(), 'LICENSE')));
        await aft.logMgr.step('about to send multipart post...');
        const resp = await httpService.performRequest({
            multipart: true,
            url: 'https://httpbin.org/post',
            postData: formData,
            method: 'POST',
            logMgr: aft.logMgr
        });

        if (resp) {
            await aft.logMgr.info(`received response.`);
        }
        expect(resp.data).to.exist;
    });
});