import { httpData, HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { aftConfig, AftConfig, AftLogger, CacheMap, JsonObject } from "aft-core";
import { JiraConfig } from "../configuration/jira-config";
import { JiraCreateIssueResponse, JiraErrorResponse, JiraIssue, JiraIssueTransition, JiraIssueTransitionsResponse, JiraSearchResults } from "./jira-custom-types";

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
     * @param issueKey the Jira issue to add the comment to _(i.e. `ABC-123`)_
     * @param comment the `string` to add as a comment
     */
    async addCommentToIssue(issueKey: string, comment: string): Promise<void> {
        const path = `/issue/${issueKey}/comment`;
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
     * @returns the Jira Issue identifier _(i.e. `ABC-123`)_
     */
    async createIssue(testId: string, summary: string, description: string): Promise<string> {
        const path = '/issue';
        const issue = {
            "fields": {
                "issuetype": {
                    "name": "Bug"
                },
                "project": {
                    "key": this.config.projectKey
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
     * @param issueKey a `string` identifier for the issue to edit _(i.e. `ABC-123`)_
     * @param updates a `map<string, any>` containing the field name and updated
     * value to be set
     */
    async editIssue(issueKey: string, updates: Map<string, any>): Promise<void> {
        const path = `/issue/${issueKey}`;
        const updateRequest = {
            "fields": {}
        };
        for (const [key, val] of updates) {
            updateRequest.fields[key] = val;
        }
        await this._put(path, JSON.stringify(updateRequest));
    }

    /**
     * sets the status of the specified Jira issue to the specified `desiredStatus`
     * @param issueKey a `string` identifier for the issue being updated _(i.e. `ABC-123`)_
     * @param desiredStatusCategoryName a `string` representing the desired status as it would be
     * displayed in the UI _(i.e. `"Done"`)_
     */
    async setIssueStatus(issueKey: string, desiredStatusCategoryName: string): Promise<void> {
        const path = `/issue/${issueKey}/transitions`;
        // get list of available statuses
        const availableTransitionStates = await this.getAvailableStatusTransitions(issueKey);
        // lookup ID for `desiredStatusCategoryName`
        let desiredStatusCategoryId: string;
        for (const transition of availableTransitionStates) {
            if (transition?.to?.statusCategory?.name === desiredStatusCategoryName) {
                desiredStatusCategoryId = transition.id;
                break;
            }
        }
        if (!desiredStatusCategoryId) {
            throw new Error(`unable to transition to desired status of '${desiredStatusCategoryName}' as only the following available: [${availableTransitionStates.map(t => t?.to?.statusCategory?.name).join(',')}]`);
        }
        const updateRequest = {
            "transition": {
                "id": `${desiredStatusCategoryId}`
            }
        }
        await this._post(path, JSON.stringify(updateRequest));
    }

    /**
     * 
     * @param issueKey the Jira issue identifier to get transitions for _(i.e. `ABC-123`)_
     * @returns an array of `JiraIssueTransition` objects representing the available transition
     * states for the given issue
     */
    async getAvailableStatusTransitions(issueKey: string): Promise<Array<JiraIssueTransition>> {
        const path = `/issue/${issueKey}/transitions`;
        const response = await this._get<JiraIssueTransitionsResponse>(path, true);
        return response?.transitions ?? [];
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
        return `${url}rest/api/latest`;
    }

    private async _makeRequest(request: HttpRequest): Promise<HttpResponse> {
        request.headers['Authorization'] = `Bearer ${await this._getAuth()}`;
        request.headers['Content-Type'] = 'application/json';
        request.headers['Accept'] = '*/*';
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
        const accessKey: string = this.config.accessKey;
        return accessKey;
    }
}
