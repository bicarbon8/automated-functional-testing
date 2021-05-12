import { nameof } from "ts-simple-nameof";
import { convert } from "aft-core";
import { HttpService, HttpResponse } from "aft-web-services";
import * as fs from "fs";
import * as path from "path";
import * as FormData from "form-data";
import { browserstackconfig, BrowserStackConfig } from "../configuration/browserstack-config";
import { MobileAppCommand, MobileAppCommandResponse } from "../../abstract-mobile-app-session-generator-plugin";

export interface BrowserStackMobileAppUploadCommand extends MobileAppCommand {
    commandType: 'upload';
    file: string;
    custom_id?: string;
}

export interface BrowserStackMobileAppUploadResponse extends MobileAppCommandResponse {
    app_url: string;
    custom_id: string;
    shareable_id: string;
}

export interface BrowserStackMobileAppNetworkCommand extends MobileAppCommand {
    commandType: 'networkProfile';
    profile: string;
    sessionId: string;
}

export interface BrowserStackMobileAppSessionStatusCommand extends MobileAppCommand {
    commandType: 'sessionStatus';
    sessionId: string;
    status: 'passed' | 'failed';
    message?: string;
}

export interface BrowserStackMobileAppGetAppsCommand extends MobileAppCommand {
    commandType: 'getApps';
}

export interface BrowserStackMobileAppGetAppsResponse extends MobileAppCommandResponse {
    apps: BrowserStackMobileApp[];
}

export interface BrowserStackMobileApp {
    app_name?: string;
    app_version?: string;
    app_url?: string;
    app_id?: string;
    uploaded_at?: string;
    custom_id?: string;
    shareable_id?: string;
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
    
    async uploadApp(data: BrowserStackMobileAppUploadCommand): Promise<BrowserStackMobileAppUploadResponse> {
        if(!fs.existsSync(data.file)) {
            return Promise.reject(`file could not be found at: ${data.file}`);
        }
        let formData: FormData = new FormData();
        formData.append(nameof<BrowserStackMobileAppUploadCommand>(o => o.file), fs.createReadStream(data.file));
        if (data.custom_id) {
            formData.append(nameof<BrowserStackMobileAppUploadCommand>(o => o.custom_id), data.custom_id);
        }
        let bsResp: HttpResponse = await this._httpSvc.performRequest({
            url: `${await this._cfg.appApiUrl()}upload`,
            method: 'POST',
            headers: {"Authorization": await this._getAuthHeader()},
            multipart: true,
            postData: formData
        });
        if (bsResp && bsResp.statusCode == 200) {
            return bsResp.dataAs<BrowserStackMobileAppUploadResponse>();
        }
        return Promise.reject(`unable to upload file '${data.file} to BrowserStack due to: ${bsResp?.data}`);
    }

    async getApps(): Promise<BrowserStackMobileAppGetAppsResponse> {
        let bsResp: HttpResponse = await this._httpSvc.performRequest({
            url: `${await this._cfg.appApiUrl()}recent_group_apps`,
            method: 'GET'
        });
        if (bsResp && bsResp.statusCode == 200) {
            return bsResp.dataAs<BrowserStackMobileAppGetAppsResponse>();
        }
        return Promise.reject(`unable to get list of mobile apps from BrowserStack due to: ${bsResp?.data}`);
    }

    async setSessionStatus(data: BrowserStackMobileAppSessionStatusCommand): Promise<any> {
        let urlPath: string = `sessions/${data.sessionId}.json`;
        let pdata: {} = {
            status: data.status,
            reason: data.message
        };
        var resp: HttpResponse = await this._httpSvc.performRequest({
            method: 'PUT',
            headers: {"Authorization": await this._getAuthHeader()},
            url: `${await this._cfg.appApiUrl()}${urlPath}`, 
            postData: JSON.stringify(pdata)
        });
        if (resp.statusCode != 200) {
            return Promise.reject(resp.data);
        }
        return resp.data;
    }

    private async _getAuthHeader(): Promise<string> {
        let user: string = await this._cfg.user();
        let key: string = await this._cfg.key();
        return `Basic ${convert.toBase64Encoded(`${user}:${key}`)}`;
    }
}