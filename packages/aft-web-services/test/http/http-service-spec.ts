import { AftConfig, rand } from "aft-core";
import * as FormData from "form-data";
import { httpService, HttpRequest, HttpResponse, httpData } from "../../src";
import { HttpService, HttpServiceConfig } from "../../src/http/http-service";

describe('HttpService', () => {
    it('will set default request values if not passed in to performRequest', async () => {
        let svc: HttpService = new HttpService();
        let actual: HttpRequest;
        spyOn<any>(svc, '_request').and.callFake((req: HttpRequest) => {
            actual = req;
        });
        spyOn<any>(svc, '_response').and.returnValue({});

        await svc.performRequest();

        expect(actual).toBeDefined();
        expect(actual.url).toEqual('http://127.0.0.1');
        expect(actual.headers).toEqual({});
        expect(actual.allowAutoRedirect).toEqual(true);
        expect(actual.method).toEqual('GET');
        expect(actual.postData).toBeUndefined();
    });

    it('can override default request values via constructor options if not passed in to performRequest', async () => {
        const aftCfg = new AftConfig({
            HttpServiceConfig: {
                defaultUrl: 'https://fake.url/test',
                defaultHeaders: {"Authorization": "basic a098dfasd09/=="},
                defaultAllowRedirect: true,
                defaultMethod: 'DELETE',
                defaultPostData: 'some-fake-post-data'
            }
        });
        let svc: HttpService = new HttpService(aftCfg);
        let actual: HttpRequest;
        spyOn<any>(svc, '_request').and.callFake((req: HttpRequest) => {
            actual = req;
        });
        spyOn<any>(svc, '_response').and.returnValue({});

        await svc.performRequest();
        const hsc = aftCfg.getSection(HttpServiceConfig);
        expect(actual).toBeDefined();
        expect(actual.url).toEqual(hsc.defaultUrl);
        expect(actual.headers).toEqual(hsc.defaultHeaders);
        expect(actual.allowAutoRedirect).toEqual(hsc.defaultAllowRedirect);
        expect(actual.method).toEqual(hsc.defaultMethod);
        expect(actual.postData).toEqual(hsc.defaultPostData);
    });

    it('can send GET request', async () => {
        let svc: HttpService = new HttpService();
        let request: HttpRequest = {
            url: 'http://127.0.0.1',
            method: 'GET'
        };

        spyOn<any>(svc, '_request').and.returnValue({});
        let mockResponse: HttpResponse = {
            statusCode: 200,
            data: '{"foo": "bar"}'
        };
        spyOn<any>(svc, '_response').and.returnValue(mockResponse);

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

        spyOn<any>(svc, '_request').and.returnValue({});
        let mockResponse: HttpResponse = {
            statusCode: 200,
            data: '{"foo": "bar"}'
        };
        spyOn<any>(svc, '_response').and.returnValue(mockResponse);

        let response: HttpResponse = await svc.performRequest(request);

        expect(response.statusCode).toEqual(200);
        expect(response.data).toEqual(mockResponse.data);
    });

    it('can send Multipart POST request', async () => {
        let svc: HttpService = new HttpService();
        let formData: FormData = new FormData();
        formData.append('foo', 'bar');
        let request: HttpRequest = {
            url: 'http://127.0.0.1',
            method: 'POST',
            postData: formData,
            multipart: true
        };

        spyOn<any>(svc, '_request').and.returnValue({});
        let mockResponse: HttpResponse = {
            statusCode: 200,
            data: '{"foo": "bar"}'
        };
        spyOn<any>(svc, '_response').and.returnValue(mockResponse);

        let response: HttpResponse = await svc.performRequest(request);

        expect(response.statusCode).toEqual(200);
        expect(response.data).toEqual(mockResponse.data);
    });

    it('can handle unreachable URLs', async () => {
        let svc: HttpService = new HttpService();
        let request: HttpRequest = {
            url: `http://${rand.getString(12)}`,
            method: 'GET'
        };

        let e: any;
        const response: HttpResponse = await svc.performRequest(request)
            .catch((err) => e = err);
        expect(e).toBeDefined();
        expect(e.toString()).toContain('getaddrinfo'); // DNS error
    }, 30000);

    /**
     * #### NOTE:
     * > only for functional local testing. not to be enabled for committed code
     */
    xit('can get values from a real web API', async () => {
        let resp: HttpResponse = await httpService.performRequest({url: 'https://reqres.in/api/users?page=2'});

        expect(resp).toBeDefined();
        expect(resp.statusCode).toBe(200);
        expect(resp.headers).toBeDefined();
        expect(resp.headers['content-type']).toBe('application/json; charset=utf-8');
        expect(resp.data).toBeDefined();
        let data: ListUsersResponse = httpData.as<ListUsersResponse>(resp);
        expect(data).toBeDefined();
        expect(data.page).toBe(2);
        expect(data.data).toBeDefined();
        expect(data.data.length).toBeGreaterThan(0);
    });
});

type ListUsersResponse = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    data: User[];
};

type User = {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    avatar: string;
};