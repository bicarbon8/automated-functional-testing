import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { greaterThan, havingValue, lessThan, retry } from "aft-core";
import { AftJasmineTest, aftJasmineTest } from "aft-jasmine-reporter";
import { httpData, HttpResponse, httpService } from 'aft-web-services';
import { ListUsersResponse } from "../lib/response-objects/list-users-response";

describe('Functional API tests using HttpService', () => {
    it('can test making a GET request from JSON REST API using `AftJasmineTest`', async () => {
        let response: HttpResponse;
        await aftJasmineTest(async (v: AftJasmineTest) => {            
            await v.reporter.step('making request...');
            const r = retry(() => httpService.performRequest({
                url: 'https://reqres.in/api/users?page=2',
                reporter: v.reporter
            })).until((res: HttpResponse) => res.statusCode >= 200 && res.statusCode < 400)
            .withDelay(100)
            .withBackOff('exponential')
            .withMaxDuration(20000);

            response = await Promise.resolve(r);
            if (!r.isSuccessful) {
                await v.reporter.error(r.lastError);
            }
            let result = await v.verify(r.totalDuration, lessThan(10000), 'expected to take less than 10sec');
            if (result.message) {
                v.fail(result.message, 'C2217763');
            }

            await v.reporter.step('confirm response is not null...');
            expect(response).toBeDefined();
            await v.reporter.info('confirmed response is not null.');
            await v.reporter.info('response status code: ' + response.statusCode);
            await v.reporter.step('confirm response.data is not null...');
            result = await v.verify(response.data, havingValue(), 'expected to return a valid response object');
            if (result.message) {
                v.fail(result.message, 'C3131');
            }

            await v.reporter.step('confirm can deserialise response.data into typed object...');
            const obj: ListUsersResponse = httpData.as<ListUsersResponse>(response);
            expect(obj).toBeDefined();
            await v.reporter.info('confirmed can deserialise response.data into typed object.');
            await v.reporter.step('confirm object data property contains more than one result...');
            result = await v.verify(obj.data.length, greaterThan(0), 'expected more than 0 results in the data array');
            if (result.message) {
                v.fail(result.message, 'C2217764');
            }
        }, {
            haltOnVerifyFailure: false,
            testIds: ['C2217763', 'C3131', 'C2217764']
        });
    });

    it('can test making a multipart post [C9876] without using `AftJasmineTest`', async () => {
        const aft = new AftJasmineTest(); // DO NOT pass a scope
        const shouldRun = await aft.shouldRun();
        if (shouldRun.result !== true) {
            await aft.pending(shouldRun.message); // calls Jasmine `pending()` function
        }
        const formData = new FormData();
        formData.append('file', fs.createReadStream(path.join(process.cwd(), 'LICENSE')));
        await aft.reporter.step('about to send multipart post...');
        const resp = await httpService.performRequest({
            multipart: true,
            url: 'https://httpbin.org/post',
            postData: formData,
            method: 'POST',
            reporter: aft.reporter
        });

        if (resp) {
            await aft.reporter.info(`received response.`);
        }
        expect(resp.data).toBeDefined();
    });
});
