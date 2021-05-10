import { HttpService, HttpServiceOptions } from "../../src/http/http-service";
import { HttpRequest } from "../../src/http/http-request";
import { HttpResponse } from "../../src/http/http-response";
import { HttpMethod } from "../../src/http/http-method";

describe('HttpService', () => {
    it('will set default request values if not passed in to performRequest', async () => {
        let svc: HttpService = new HttpService();
        let actual: HttpRequest;
        spyOn<any>(svc, 'request').and.callFake((req: HttpRequest) => {
            actual = req;
        });
        spyOn<any>(svc, 'response').and.returnValue({});

        await svc.performRequest();

        expect(actual).toBeDefined();
        expect(actual.url).toEqual('http://127.0.0.1');
        expect(actual.headers).toEqual({});
        expect(actual.allowAutoRedirect).toEqual(true);
        expect(actual.method).toEqual('GET');
        expect(actual.postData).toBeUndefined();
    });

    it('can override default request values via constructor options if not passed in to performRequest', async () => {
        let options: HttpServiceOptions = {
            defaultUrl: 'https://fake.url/test',
            defaultHeaders: {"Authorization": "basic a098dfasd09/=="},
            defaultAllowRedirect: true,
            defaultMethod: 'DELETE',
            defaultPostData: 'some-fake-post-data'
        };
        let svc: HttpService = new HttpService(options);
        let actual: HttpRequest;
        spyOn<any>(svc, 'request').and.callFake((req: HttpRequest) => {
            actual = req;
        });
        spyOn<any>(svc, 'response').and.returnValue({});

        await svc.performRequest();

        expect(actual).toBeDefined();
        expect(actual.url).toEqual(options.defaultUrl);
        expect(actual.headers).toEqual(options.defaultHeaders);
        expect(actual.allowAutoRedirect).toEqual(options.defaultAllowRedirect);
        expect(actual.method).toEqual(options.defaultMethod);
        expect(actual.postData).toEqual(options.defaultPostData);
    });

    it('can send GET request', async () => {
        let svc: HttpService = new HttpService();
        let request: HttpRequest = {
            url: 'http://127.0.0.1',
            method: 'GET'
        };

        spyOn<any>(svc, 'request').and.returnValue({});
        let mockResponse: HttpResponse = new HttpResponse({
            statusCode: 200,
            data: '{"foo": "bar"}'
        });
        spyOn<any>(svc, 'response').and.returnValue(mockResponse);

        let response: HttpResponse = await svc.performRequest(request);

        expect(response.statusCode).toEqual(200);
        expect(response.data).toEqual(mockResponse.data);
    });

    it('can send POST request', async () => {
        let svc: HttpService = new HttpService();
        let request: HttpRequest = {
            url: 'http://127.0.0.1',
            method: 'POST',
            postData: '{"hello":"world"}'
        };

        spyOn<any>(svc, 'request').and.returnValue({});
        let mockResponse: HttpResponse = new HttpResponse({
            statusCode: 200,
            data: '{"foo": "bar"}'
        });
        spyOn<any>(svc, 'response').and.returnValue(mockResponse);

        let response: HttpResponse = await svc.performRequest(request);

        expect(response.statusCode).toEqual(200);
        expect(response.data).toEqual(mockResponse.data);
    });

    /**
     * NOTE: only for functional local testing. not to be enabled for committed code
     */
    xit('can get values from a real web API', async () => {
        let resp: HttpResponse = await HttpService.instance.performRequest({url: 'https://reqres.in/api/users?page=2'});

        expect(resp).toBeDefined();
        expect(resp.statusCode).toBe(200);
        expect(resp.headers).toBeDefined();
        expect(resp.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(resp.data).toBeDefined();
        let data: ListUsersResponse = resp.dataAs<ListUsersResponse>();
        expect(data).toBeDefined();
        expect(data.page).toBe(2);
        expect(data.data).toBeDefined();
        expect(data.data.length).toBeGreaterThan(0);
    });
});

interface ListUsersResponse {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: User[];
}

interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
}