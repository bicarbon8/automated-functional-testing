import { convert, IHasOptions, LogManager, optmgr } from "aft-core";
import { HttpResponse, httpService, httpData } from "aft-web-services";
import * as fs from "fs";
import * as FormData from "form-data";
import { BrowserStackMobileApp, RecentGroupAppsResponse, SetSessionStatusRequest, UploadRequest, UploadResponse } from "./app-automate-api-custom-types";

export type BrowserStackAppAutomateApiOptions = {
    apiUrl?: string;
    user?: string;
    key?: string;
    logMgr?: LogManager;
};

export class BrowserStackAppAutomateApi implements IHasOptions<BrowserStackAppAutomateApiOptions> {
    private _options: BrowserStackAppAutomateApiOptions;
    private _apiUrl: string;
    private _user: string;
    private _key: string;
    private _logMgr: LogManager;
    
    constructor(options?: BrowserStackAppAutomateApiOptions) {
        options = options || {} as BrowserStackAppAutomateApiOptions;
        this._options = optmgr.process(options);
    }

    option<K extends keyof BrowserStackAppAutomateApiOptions, V extends BrowserStackAppAutomateApiOptions[K]>(key: K, defaultVal?: V): V {
        const response: V = this._options[key] as V;
        return (response === undefined) ? defaultVal : response;
    }

    get apiUrl(): string {
        if (!this._apiUrl) {
            this._apiUrl = this.option('apiUrl', 'https://api.browserstack.com/app-automate/');
        }
        return this._apiUrl;
    }

    get user(): string {
        if (!this._user) {
            this._user = this.option('user');
        }
        return this._user;
    }

    get key(): string {
        if (!this._key) {
            this._key = this.option('key');
        }
        return this._key;
    }

    get logMgr(): LogManager {
        if (!this._logMgr) {
            this._logMgr = this.option('logMgr') || new LogManager({logName: this.constructor.name});
        }
        return this._logMgr;
    }
    
    async uploadApp(data: UploadRequest): Promise<UploadResponse> {
        const url = this.apiUrl;
        if(!fs.existsSync(data.file)) {
            return Promise.reject(`file could not be found at: ${data.file}`);
        }
        let formData: FormData = new FormData();
        formData.append('file', fs.createReadStream(data.file));
        if (data.custom_id) {
            formData.append('custom_id', data.custom_id);
        }
        let bsResp: HttpResponse = await httpService.performRequest({
            url: `${url}upload`,
            method: 'POST',
            headers: {"Authorization": await this._getAuthHeader()},
            multipart: true,
            postData: formData,
            logMgr: this._logMgr
        });
        if (bsResp && bsResp.statusCode == 200) {
            return httpData.as<UploadResponse>(bsResp);
        }
        return Promise.reject(`unable to upload file '${data.file} to BrowserStack due to: ${bsResp?.data}`);
    }

    async getApps(): Promise<RecentGroupAppsResponse> {
        const url = this.apiUrl;
        let bsResp: HttpResponse = await httpService.performRequest({
            url: `${url}recent_group_apps`,
            method: 'GET',
            headers: {"Authorization": await this._getAuthHeader()},
            logMgr: this._logMgr
        });
        if (bsResp && bsResp.statusCode == 200) {
            return {apps: httpData.as<BrowserStackMobileApp[]>(bsResp)};
        }
        return Promise.reject(`unable to get list of mobile apps from BrowserStack due to: ${bsResp?.data}`);
    }

    async setSessionStatus(data: SetSessionStatusRequest): Promise<void> {
        const url = this.apiUrl;
        let urlPath: string = `sessions/${data.sessionId}.json`;
        let pdata: {} = {
            status: data.status,
            reason: data.message
        };
        var resp: HttpResponse = await httpService.performRequest({
            method: 'PUT',
            headers: {"Authorization": await this._getAuthHeader()},
            url: `${url}${urlPath}`, 
            postData: JSON.stringify(pdata),
            logMgr: this._logMgr
        });
        if (resp.statusCode != 200) {
            return Promise.reject(resp.data);
        }
    }

    private async _getAuthHeader(): Promise<string> {
        return `Basic ${convert.toBase64Encoded(`${this.user}:${this.key}`)}`;
    }
}