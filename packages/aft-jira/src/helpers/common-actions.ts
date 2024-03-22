import { JiraApi } from "../api/jira-api";
import { JiraIssue, JiraSearchResults } from "../api/jira-custom-types";

export class CommonActions {
    public static async getOpenIssuesReferencingTestId(testId: string, api: JiraApi): Promise<Array<JiraIssue>> {
        const openIssues = new Array<JiraIssue>();
        let index = 0;
        const maxResults = 50;
        let existingOpenIssues: JiraSearchResults;
        do {
            const jql = `statusCategory!=3+and+issuetype=bug+and+summary~[${testId}]&startAt=${index}&maxResults=${maxResults}`;
            existingOpenIssues = await api.searchIssues(jql);
            openIssues.push(...existingOpenIssues.issues);
            index += existingOpenIssues.maxResults;
        } while (index < existingOpenIssues.total);
        return openIssues;
    }
}