import * as fs from "fs";
import * as path from "path";
import { JiraApi } from "../../src/api/jira-api";
import { HttpRequest, HttpResponse, httpService } from "aft-web-services";
import { JiraIssue, JiraSearchResults, JiraFields } from "../../src/api/jira-custom-types";
import { AftConfig, rand } from "aft-core";

describe('JiraApi', () => {
    beforeEach(() => {
        const fsmapPath: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(fsmapPath)) {
            fs.rmSync(fsmapPath, {recursive: true, force: true});
        }
    });

    it('can cache successful responses', async () => {
        const searchResponse = {
            issues: new Array({
                id: `${rand.getString(4, true, false, false, false)}-${rand.getString(4, false, true, false, false)}`,
                fields: {
                    created: new Date().toISOString(),
                    comment: rand.getString(100),
                    description: rand.getString(100)
                } as JiraFields
            } as JiraIssue)
        } as JiraSearchResults;
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            const response: HttpResponse = {
                statusCode: 200,
                headers: {},
                data: JSON.stringify(searchResponse)
            };
            return response;
        });

        const aftCfg = new AftConfig({
            JiraConfig: {
                url: 'http://127.0.0.1/',
                user: 'fake@fake.fake',
                accesskey: 'fake_key',
            }
        });
        const api: JiraApi = new JiraApi(aftCfg);
        const jql = 'fake_query';
        const issues: Array<JiraIssue> = await api.searchIssues(jql);

        expect(issues).toBeDefined();
        expect(issues.length).toEqual(1);
        expect(issues[0].id).toEqual(searchResponse.issues[0].id);
        expect(httpService.performRequest).toHaveBeenCalledTimes(1);

        const cachedResponse: Array<JiraIssue> = await api.searchIssues(jql);

        expect(cachedResponse).toBeDefined();
        expect(cachedResponse.length).toEqual(1);
        expect(cachedResponse[0].id).toEqual(searchResponse.issues[0].id);
        expect(httpService.performRequest).toHaveBeenCalledTimes(1); // no additional call made
    });

    it('will not cache non 200-299 status code responses', async () => {
        spyOn(httpService, 'performRequest').and.callFake(async (request: HttpRequest): Promise<HttpResponse> => {
            let response: HttpResponse = {
                statusCode: 404,
                data: '{}',
                headers: {}
            };
            return response;
        });

        const aftCfg = new AftConfig({
            JiraConfig: {
                url: 'http://127.0.0.1/',
                user: 'fake@fake.fake',
                accesskey: 'fake_key'
            }
        });
        const api: JiraApi = new JiraApi(aftCfg);
        const test: any = await api.searchIssues('fake-query');

        expect(test).not.toBeNull();
        expect(httpService.performRequest).toHaveBeenCalledTimes(1);

        const nonCachedResponse: any = await api.searchIssues('fake-query');

        expect(nonCachedResponse).not.toBeNull();
        expect(httpService.performRequest).toHaveBeenCalledTimes(2); // failure on request so nothing cached
    });
});
