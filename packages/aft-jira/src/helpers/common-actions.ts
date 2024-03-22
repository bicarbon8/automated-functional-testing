import { JiraApi } from "../api/jira-api";
import { JiraIssue, JiraSearchResults } from "../api/jira-custom-types";

export class CommonActions {
    public static async getOpenIssuesReferencingTestId(testId: string, api: JiraApi): Promise<Array<JiraIssue>> {
        const jql = `statusCategory!=3+and+issuetype=bug+and+summary~[${testId}]`;
        const existingOpenIssues: JiraSearchResults = await api.searchIssues(jql);
        return existingOpenIssues?.issues ?? [];
    }
}