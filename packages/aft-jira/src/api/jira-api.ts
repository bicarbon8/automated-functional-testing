import { httpData, HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { aftConfig, AftConfig, CacheMap, convert, JsonObject } from "aft-core";
import { JiraConfig } from "../configuration/jira-config";
import { JiraSearchResults } from "./jira-custom-types";

export class JiraApi {
    private readonly _aftCfg: AftConfig;
    private readonly _cache: CacheMap<string, any>;
    
    constructor(aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._cache = new CacheMap<string, any>(this.config.cacheDuration, true, this.constructor.name);
    }

    get config(): JiraConfig {
        return this._aftCfg.getSection(JiraConfig);
    }

    async createIssue(): Promise<void> {
        // TODO
    }

    async searchIssues(jql: string): Promise<JiraSearchResults> {
        const path = `/search?jql=${jql}`;
        const results = await this._get<JiraSearchResults>(path, true);
        return results;
    }

    private async _get<T extends JsonObject>(path: string, cacheResponse: boolean): Promise<T> {
        const apiUrl: string = await this._getApiUrl();
        const request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'GET',
            headers: {}
        };
        let data: T = this._cache.get(request.url);
        if (!data) {
            const response: HttpResponse = await this._makeRequest(request);
            data = httpData.as<T>(response);
            if (cacheResponse && response.statusCode >= 200 && response.statusCode <= 299) {
                this._cache.set(request.url, data);
            }
        }

        return data;
    }

    private async _post<T extends JsonObject>(path: string, data: string): Promise<T> {
        const apiUrl: string = await this._getApiUrl();
        const request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'POST',
            postData: data,
            headers: {}
        };

        const response: HttpResponse = await this._makeRequest(request);

        return httpData.as<T>(response);
    }

    private async _getApiUrl(): Promise<string> {
        let url = this.config.url;
        if (url && !url.endsWith('/')) {
            url += '/';
        }
        return `${url}rest/api/2`;
    }

    private async _makeRequest(request: HttpRequest): Promise<HttpResponse> {
        request.headers['Authorization'] = `Basic ${await this._getAuth()}`;
        request.headers['Content-Type'] = 'application/json';
        const response: HttpResponse = await httpService.performRequest(request);
        return response;
    }

    private async _getAuth(): Promise<string> {
        const username: string = this.config.user;
        const accessKey: string = this.config.accessKey;
        return convert.toBase64Encoded(`${username}:${accessKey}`);
    }
}
