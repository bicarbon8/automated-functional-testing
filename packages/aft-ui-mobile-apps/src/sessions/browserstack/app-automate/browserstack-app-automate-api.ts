import { OptionsManager } from "aft-core";
import { HttpService, HttpResponse } from "aft-web-services";
import { nameof } from "ts-simple-nameof";
import * as path from "path";

export interface UploadAppResponse {
    app_url: string;
    custom_id: string;
    shareable_id: string;
}

export interface BrowserStackAppAutomateApiOptions {
    apiUrl?: string;
    
    _httpSvc?: HttpService;
    _optMgr?: OptionsManager;
}

export class BrowserStackAppAutomateApi {
    private _httpSvc: HttpService;
    private _apiUrl: string;
    private _optionsMgr: OptionsManager;

    constructor(options?: BrowserStackAppAutomateApiOptions) {
        this._optionsMgr = options?._optMgr || new OptionsManager(nameof(BrowserStackAppAutomateApi).toLowerCase(), options);
        this._httpSvc = options?._httpSvc || HttpService.instance;
    }

    async apiUrl(): Promise<string> {
        if (!this._apiUrl) {
            this._apiUrl = await this._optionsMgr.getOption(nameof<BrowserStackAppAutomateApiOptions>(o => o.apiUrl), 'https://api.browserstack.com/app-automate/');
        }
        return this._apiUrl;
    }
    
    async uploadApp(file: string, customId?: string): Promise<UploadAppResponse> {
        let bsResp: HttpResponse = await this._httpSvc.performRequest({
            url: await this.apiUrl(),
            method: 'POST'
        });
        if (bsResp && bsResp.statusCode == 200) {
            return bsResp.dataAs<UploadAppResponse>();
        }
        throw `unable to upload file '${file} to BrowserStack`;
    }

    async setSessionStatus(sessionId: string, status?: 'passed' | 'failed', message?: string): Promise<void> {
        let stat: 'passed' | 'failed' = status ?? 'passed';
        if (!sessionId) {
            return Promise.reject('sessionId must be set to a valid session');
        }
        let urlPath: string = `sessions/${sessionId}.json`;
        let data: {} = {
            status: stat,
            reason: message
        };
        var resp: HttpResponse = await this._httpSvc.performRequest({
            method: 'PUT', 
            url: path.join(await this.apiUrl(), urlPath), 
            postData: JSON.stringify(data)
        });
        if (resp.statusCode != 200) {
            return Promise.reject(resp.data);
        }
    }
}

export module BrowserStackAppAutomateApi {
    var _inst: BrowserStackAppAutomateApi;
    export function instance(): BrowserStackAppAutomateApi {
        if (!_inst) {
            _inst = new BrowserStackAppAutomateApi();
        }
        return _inst;
    }
}