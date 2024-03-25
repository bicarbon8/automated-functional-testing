import { httpData, HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { aftConfig, AftConfig, AftLogger, CacheMap, convert, Err, JsonObject } from "aft-core";
import { JiraConfig } from "../configuration/jira-config";
import { JiraCreateIssueResponse, JiraErrorResponse, JiraIssue, JiraSearchResults } from "./jira-custom-types";

export class JiraApi {
    private readonly _aftCfg: AftConfig;
    private readonly _cache: CacheMap<string, any>;
    private readonly _logger: AftLogger;
    
    constructor(aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._cache = new CacheMap<string, any>(this.config.cacheDuration, true, this.constructor.name);
        this._logger = new AftLogger(this._aftCfg);
    }

    get config(): JiraConfig {
        return this._aftCfg.getSection(JiraConfig);
    }

    /**
     * adds a comment to a Jira Issue
     * @param issueId the Jira issue to add the comment to
     * @param comment the `string` to add as a comment
     */
    async addCommentToIssue(issueId: string, comment: string): Promise<void> {
        const path = `/issue/${issueId}/comment`;
        const commentRequest = {
            "body": comment
        };
        await this._post(path, JSON.stringify(commentRequest));
    }

    /**
     * creates a new Jira Issue referencing the passed in `testId` and returns
     * the identifier for the new issue. the project used when creating the issue
     * is taken directly from the `JiraConfig.projectId` property
     * @param testId the id of the failing test case
     * @param summary the name of the failing test case
     * @param description the exception or error message of the failure
     * @returns the Jira Issue identifier
     */
    async createIssue(testId: string, summary: string, description: string): Promise<string> {
        const path = '/issue';
        const issue = {
            "fields": {
                "project": {
                    "id": this.config.projectId
                },
                "summary": `[${testId}] ${summary}`,
                "description": description
            }
        }
        const response = await this._post<JiraCreateIssueResponse>(path, JSON.stringify(issue));
        return response?.key ?? 'ERROR';
    }

    /**
     * updates a Jira issue by ID setting a new value for each item in the passed
     * in `updates` map
     * @param issueId a `string` ID for the issue to edit
     * @param updates a `map<string, string>` containing the field name and updated
     * value to be set
     */
    async editIssue(issueId: string, updates: Map<string, string>): Promise<void> {
        const path = `/issue/${issueId}`;
        const updateRequest = {
            "update": {}
        };
        for (const [key, val] of updates) {
            updateRequest.update[key] = [{"set": val}]
        }
        await this._put(path, JSON.stringify(updateRequest));
    }

    /**
     * uses the passed in `JQL` query to search for issues and returns them as an array
     * NOTE: any paginated results are handled automatically
     * @param jql a `string` containing a valid `JQL` query used to search for issues
     * @returns an array of `JiraIssue` objects matching the query
     */
    async searchIssues(jql: string): Promise<Array<JiraIssue>> {
        const issues = new Array<JiraIssue>();
        let index = 0;
        const maxResults = 50;
        let searchResults: JiraSearchResults;
        do {
            const path = `/search?jql=${jql}&startAt=${index}&maxResults=${maxResults}`;
            searchResults = await this._get<JiraSearchResults>(path, true);
            issues.push(...searchResults?.issues ?? []);
            index += searchResults.maxResults;
        } while (index < searchResults.total);
        
        return issues;
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

    private async _put<T extends JsonObject>(path: string, data: string): Promise<T> {
        const apiUrl: string = await this._getApiUrl();
        const request: HttpRequest = {
            url: `${apiUrl}${path}`,
            method: 'PUT',
            postData: data,
            headers: {}
        };

        const response: HttpResponse = await this._makeRequest(request);

        return httpData.as<T>(response);
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
        if (response.statusCode < 200 || response.statusCode > 299) {
            const err = httpData.as<JiraErrorResponse>(response);
            this._logger.log({
                level: 'warn',
                message: 'non 200 status code returned from Jira API call',
                name: this.constructor.name,
                args: [err]
            });
        }
        return response;
    }

    private async _getAuth(): Promise<string> {
        const username: string = this.config.user;
        const accessKey: string = this.config.accessKey;
        return convert.toBase64Encoded(`${username}:${accessKey}`);
    }
}
