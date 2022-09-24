import { cfgmgr, IConfigProvider, IHasConfig, IHasOptions, optmgr } from "aft-core";
import * as http from 'http';
import * as https from 'https';
import * as FormData from "form-data";
import { HttpMethod, HttpRequest, HttpResponse } from "./http-custom-types";

export type HttpServiceOptions = {
    defaultUrl?: string;
    defaultHeaders?: object;
    defaultMethod?: string;
    defaultAllowRedirect?: boolean;
    defaultPostData?: string;
    defaultMultipart?: boolean;
};

/**
 * supports performing requests over http / https returning the response as a
 * `HttpResponse` object. Requests should include a URL at a minimum,
 * but may also specify additional details such as headers, auto redirect,
 * post data and the request method (GET|POST|PUT|DELETE|UPDATE)
 * ex:
 * ```typescript
 * await httpService.performRequest({url: 'https://some.domain/path'});
 * ```
 * or fully as:
 * ```typescript
 * await httpService.performRequest({
 *     url: 'https://some.domain/path',
 *     allowAutoRedirect: false,
 *     headers: {"Authorization": "basic AS0978FASLKLJA/=="},
 *     method: 'POST',
 *     postData: someObject,
 *     multipart: false
 * });
 * ```
 * or multipart post as:
 * ```typescript
 * let formData = new FormData();
 * formData.append("Authorization": "basic AS0978FASLKLJA/==");
 * await httpService.performRequest({
 *     url: 'https://some.domain/path',
 *     allowAutoRedirect: false,
 *     method: 'POST',
 *     postData: formData,
 *     multipart: true
 * });
 * ```
 */
export class HttpService implements IHasConfig<HttpServiceOptions>, IHasOptions<HttpServiceOptions> {
    private _config: IConfigProvider<HttpServiceOptions>;
    private _opts: HttpServiceOptions;

    constructor(options?: HttpServiceOptions) {
        options = options || {} as HttpServiceOptions;
        this._opts = optmgr.process(options);
    }

    option<K extends keyof HttpServiceOptions, V extends HttpServiceOptions[K]>(key: K, defaultVal?: V): V {
        const result: V = this._opts[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    config<K extends keyof HttpServiceOptions, V extends HttpServiceOptions[K]>(key: K, defaultVal?: V): Promise<V> {
        if (!this._config) {
            this._config = cfgmgr.get(this.constructor.name, this._opts);
        }
        return this._config.get(key, defaultVal);
    }

    /**
     * issues a request over http / https and returns the response as a
     * `HttpResponse` object. Requests should include a URL at a minimum,
     * but may also specify additional details such as headers, auto redirect,
     * post data and the request method (GET|POST|PUT|DELETE|UPDATE)
     * ex:
     * ```typescript
     * await httpService.performRequest({url: 'https://some.domain/path'});
     * ```
     * or fully as:
     * ```typescript
     * await httpService.performRequest({
     *     url: 'https://some.domain/path',
     *     allowAutoRedirect: false,
     *     headers: {"Authorization": "basic AS0978FASLKLJA/=="},
     *     method: 'POST',
     *     postData: someObject,
     *     multipart: false
     * });
     * ```
     * or multipart post as:
     * ```typescript
     * let formData = new FormData();
     * formData.append("Authorization": "basic AS0978FASLKLJA/==");
     * await httpService.performRequest({
     *     url: 'https://some.domain/path',
     *     allowAutoRedirect: false,
     *     method: 'POST',
     *     postData: formData,
     *     multipart: true
     * });
     * ```
     * @param req a `HttpResponse` object that specifies details of the request
     */
    async performRequest(req?: HttpRequest): Promise<HttpResponse> {
        try {
            req = await this.setRequestDefaults(req);

            await req.logMgr?.debug(`issuing '${req.method}' request to '${req.url}' with post body '${req.postData}' and headers '${JSON.stringify(req.headers)}'.`);
            
            const message = await this._request(req);
            const resp = await this._response(message, req.allowAutoRedirect);

            await req.logMgr?.debug(`received response data of '${resp?.data}' and headers '${JSON.stringify(resp?.headers)}'.`)
            
            return resp;
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private async setRequestDefaults(req?: HttpRequest): Promise<HttpRequest> {
        req ??=  {} as HttpRequest;
        req.url ??= await this.config('defaultUrl', 'http://127.0.0.1');
        req.headers ??= await this.config('defaultHeaders', {});
        req.method ??= await this.config<any, HttpMethod>('defaultMethod', 'GET');
        req.allowAutoRedirect ??= await this.config('defaultAllowRedirect', true);
        req.postData ??= await this.config('defaultPostData');
        req.multipart ??= await this.config('defaultMultipart', false);
        return req;
    }

    private async _request(r: HttpRequest): Promise<http.IncomingMessage> {
        return new Promise<http.IncomingMessage>((resolve, reject) => {
            try {
                const client = (r.url.includes('https://')) ? https : http;
                let req: http.ClientRequest;
                if (r.multipart) {
                    const form: FormData = r.postData as FormData;
                    req = client.request(r.url, {
                        headers: form.getHeaders(r.headers),
                        method: r.method
                    });
                    req = form.pipe(req, {end: true});
                } else {
                    req = client.request(r.url, {
                        headers: r.headers,
                        method: r.method
                    });
                    if (r.postData) {
                        req.write(JSON.stringify(r.postData));
                    }
                    req.end(); // close the request
                }
                req?.on('error', reject);
                req?.on('response', resolve);
            } catch (e) {
                reject(e);
            }
        });
    }

    private async _response(message: http.IncomingMessage, allowAutoRedirect: boolean = true): Promise<HttpResponse> {
        message.setEncoding('utf8');
        // handle 302 redirect response if enabled
        if (message.statusCode == 302 && allowAutoRedirect) {
            const req: HttpRequest = {
                url: message.headers.location,
                headers: {'Cookie': ''}
            };
            for (var header in message.headers) {
                if (Object.prototype.hasOwnProperty.call(message.headers, header)) {
                    if (header.toLocaleLowerCase() == 'set-cookie') {
                        req.headers['Cookie'] += message.headers[header] + '; ';
                    }
                }
            }
            const redirectedMessage: http.IncomingMessage = await this._request(req);
            return await this._response(redirectedMessage, allowAutoRedirect);
        } else {
            const response: HttpResponse = {
                statusCode: message.statusCode,
                headers: message.headers
            };
            await new Promise<any>((resolve, reject) => {
                try {
                    message.on('data', (chunk) => {
                        if (!response.data) {
                            response.data = '';
                        }
                        response.data += chunk;
                    });
                    message.on('end', resolve);
                } catch (e) {
                    reject(e);
                }
            });
            return response;
        }
    }
}

/**
 * supports performing requests over http / https returning the response as a
 * `HttpResponse` object. Requests should include a URL at a minimum,
 * but may also specify additional details such as headers, auto redirect,
 * post data and the request method (GET|POST|PUT|DELETE|UPDATE)
 * ex:
 * ```typescript
 * await httpService.performRequest({url: 'https://some.domain/path'});
 * ```
 * or fully as:
 * ```typescript
 * await httpService.performRequest({
 *     url: 'https://some.domain/path',
 *     allowAutoRedirect: false,
 *     headers: {"Authorization": "basic AS0978FASLKLJA/=="},
 *     method: 'POST',
 *     postData: someObject,
 *     multipart: false
 * });
 * ```
 * or multipart post as:
 * ```typescript
 * let formData = new FormData();
 * formData.append("Authorization": "basic AS0978FASLKLJA/==");
 * await httpService.performRequest({
 *     url: 'https://some.domain/path',
 *     allowAutoRedirect: false,
 *     method: 'POST',
 *     postData: formData,
 *     multipart: true
 * });
 * ```
 */
export const httpService = new HttpService();