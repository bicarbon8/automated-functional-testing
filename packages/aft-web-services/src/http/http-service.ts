import { HttpRequest } from "./http-request";
import { HttpResponse } from "./http-response";
import { OptionsManager, LoggingPluginManager } from "aft-core";
import * as http from 'http';
import * as https from 'https';
import { nameof } from "ts-simple-nameof";
import * as FormData from "form-data";

export interface HttpServiceOptions {
    defaultUrl?: string;
    defaultAllowRedirect?: boolean;
    defaultHeaders?: http.OutgoingHttpHeaders;
    defaultMethod?: string;
    defaultPostData?: string;
    defaultMultipart?: boolean;
    
    _logMgr?: LoggingPluginManager;
    _optMgr?: OptionsManager;
}

export class HttpService {
    readonly optionsMgr: OptionsManager;

    private _logMgr: LoggingPluginManager;

    constructor(options?: HttpServiceOptions) {
        this.optionsMgr = options?._optMgr || new OptionsManager(nameof(HttpService).toLowerCase(), options);
        this._logMgr = options?._logMgr || new LoggingPluginManager({logName: nameof(HttpService)});
    }

    /**
     * issues a request over http / https and returns the response as a
     * `HttpResponse` object. Requests should include a URL at a minimum,
     * but may also specify additional details such as headers, auto redirect,
     * post data and the request method (GET|POST|PUT|DELETE|UPDATE)
     * ex:
     * ```
     * await HttpService.instance.performRequest({url: 'https://some.domain/path'});
     * ```
     * or fully as:
     * ```
     * await HttpService.instance.performRequest({
     *     url: 'https://some.domain/path',
     *     allowAutoRedirect: false,
     *     headers: {"Authorization": "basic AS0978FASLKLJA/=="},
     *     method: 'POST',
     *     postData: JSON.stringify(someObject),
     *     multipart: false
     * });
     * ```
     * or multipart post as:
     * ```
     * await HttpService.instance.performRequest({
     *     url: 'https://some.domain/path',
     *     allowAutoRedirect: false,
     *     method: 'POST',
     *     postData: JSON.stringify(someObject),
     *     multipart: true
     * });
     * ```
     * @param req a {HttpResponse} object that specifies details of the request
     */
    async performRequest(req?: HttpRequest): Promise<HttpResponse> {
        req = await this.setRequestDefaults(req);
        await this._logMgr.trace(`issuing '${req.method}' request to '${req.url}' with post body '${req.postData}' and headers '${JSON.stringify(req.headers)}'.`);
        
        let message: http.IncomingMessage = await this._request(req);

        let resp: HttpResponse = await this._response(message, req);

        await this._logMgr.trace(`received response of '${resp.data}' and headers '${JSON.stringify(resp.headers)}'.`);
        return resp;
    }

    private async setRequestDefaults(req?: HttpRequest): Promise<HttpRequest> {
        if (!req) {
            req = {} as HttpRequest;
        }
        req.url = req.url || await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultUrl), 'http://127.0.0.1');
        req.headers = req.headers || await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultHeaders), {});
        req.method = req.method || await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultMethod), 'GET');
        if (req.allowAutoRedirect === undefined) {
            req.allowAutoRedirect = await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultAllowRedirect), true);
        }
        req.postData = req.postData || await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultPostData));
        if (req.multipart === undefined) {
            req.multipart = await this.optionsMgr.getOption(nameof<HttpServiceOptions>(o => o.defaultMultipart), false);
        }
        return req;
    }

    private async _request(r: HttpRequest): Promise<http.IncomingMessage> {
        let message: http.IncomingMessage = await new Promise<http.IncomingMessage>((resolve, reject) => {
            try {
                let client = (r.url.includes('https://')) ? https : http;
                let req: http.ClientRequest;
                let form: FormData = r.postData as FormData;
                if (r.multipart) {
                    req = client.request(r.url, {
                        headers: form.getHeaders(),
                        method: r.method
                    }, resolve);
                    form.pipe(req, {end: true});
                } else {
                    req = client.request(r.url, {
                        headers: r.headers,
                        method: r.method
                    }, resolve);
                    if (r.method == 'POST' || r.method == 'UPDATE' || r.method == 'PUT') {
                        if (r.postData) {
                            req.write(r.postData);
                        }
                    }
                    req.end(); // close the request
                }
            } catch (e) {
                reject(e);
            }
        });
        return message;
    }

    private async _response(message: http.IncomingMessage, req: HttpRequest): Promise<HttpResponse> {
        message.setEncoding('utf8');

        // handle 302 redirect response if enabled
        if (message.statusCode == 302 && req.allowAutoRedirect) {
            let req: HttpRequest = {
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
            let redirectedMessage: http.IncomingMessage = await this._request(req);
            return await this._response(redirectedMessage, req);
        } else {
            let response: HttpResponse = new HttpResponse({
                statusCode: message.statusCode,
                headers: message.headers
            });
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

export module HttpService {
    export var instance: HttpService = new HttpService();
}