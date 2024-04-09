import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { AftTest, greaterThan, havingValue, lessThan, retry, aftTest } from "aft-core";
import { AftJasmineTest } from "aft-jasmine-reporter";
import { httpData, HttpResponse, httpService } from 'aft-web-services';
import { ListUsersResponse } from "../lib/response-objects/list-users-response";

describe('Functional API tests using HttpService', () => {
    it('can make GET request from JSON REST API', async () => {
        const aft = new AftJasmineTest(); // DO NOT pass a scope
        let response: HttpResponse;
        await aftTest(async (v: AftTest) => {            
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
            return r.totalDuration;
        }).withDescription('takes less than 10sec')
        .and.withTestIds('C2217763')
        .and.internals.usingReporter(aft.reporter)
        .returns(lessThan(10000));

        await aftTest(async (v: AftTest) => {
            await v.reporter.step('confirm response is not null...');
            expect(response).toBeDefined();
            await v.reporter.info('confirmed response is not null.');
            await v.reporter.info('response status code: ' + response.statusCode);
            await v.reporter.step('confirm response.data is not null...');
            return response.data;
        }).withDescription('returns a valid response object')
        .and.withTestIds('C3131')
        .and.internals.usingReporter(aft.reporter)
        .returns(havingValue());

        await aftTest(async (v: AftTest) => {
            await v.reporter.step('confirm can deserialise response.data into typed object...');
            const obj: ListUsersResponse = httpData.as<ListUsersResponse>(response);
            expect(obj).toBeDefined();
            await v.reporter.info('confirmed can deserialise response.data into typed object.');
            await v.reporter.step('confirm object data property contains more than one result...');
            return obj.data.length;
        }).withDescription('receives more than 0 results in the data array')
        .and.withTestIds('C2217764')
        .and.internals.usingReporter(aft.reporter)
        .returns(greaterThan(0));
    });

    it('can make a multipart post [C9876]', async () => {
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
