import { convert, OptionsManager } from "aft-core";
import { HttpService, HttpResponse } from "aft-web-services";
import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { browserstackconfig, BrowserStackConfig } from "../configuration/browserstack-config";

export interface UploadAppResponse {
    app_url: string;
    custom_id: string;
    shareable_id: string;
}

export interface BrowserStackAppAutomateApiOptions {
    _config: BrowserStackConfig;
    _httpSvc?: HttpService;
}

export class BrowserStackAppAutomateApi {
    private _cfg: BrowserStackConfig;
    private _httpSvc: HttpService;

    constructor(options?: BrowserStackAppAutomateApiOptions) {
        this._cfg = options?._config || browserstackconfig;
        this._httpSvc = options?._httpSvc || HttpService.instance;
    }
    
    async uploadApp(file: string, customId?: string): Promise<UploadAppResponse> {
        let formData: FormData = new FormData();
        formData.append("file", fs.createReadStream(file));
        if (customId) {
            formData.append("custom_id", customId);
        }
        let bsResp: HttpResponse = await this._httpSvc.performRequest({
            url: await this._cfg.appApiUrl(),
            method: 'POST',
            multipart: true,
            postData: formData
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
            headers: {"Authorization": await this._getAuthHeader()},
            url: path.join(await this._cfg.appApiUrl(), urlPath), 
            postData: JSON.stringify(data)
        });
        if (resp.statusCode != 200) {
            return Promise.reject(resp.data);
        }
    }

    private async _getAuthHeader(): Promise<string> {
        let user: string = await this._cfg.user();
        let key: string = await this._cfg.key();
        return `basic ${convert.toBase64Encoded(`${user}:${key}`)}`;
    }
}