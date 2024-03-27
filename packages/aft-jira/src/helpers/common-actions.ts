import { JiraApi } from "../api/jira-api";
import { JiraIssue } from "../api/jira-custom-types";

export class CommonActions {
    /**
     * performs a JQL search for any Jira issues whose summary includes
     * the specified `testId` enclosed in square brackets
     * (i.e. `some text [ABC-123] and more text`) and are of type `bug`
     * and are not closed
     * @param testId the ID of the referenced test case
     * @param api a `JiraApi` instance
     * @returns an array of open `JiraIssue` objects that all reference
     * the specified `testId`
     */
    public static async getOpenIssuesReferencingTestId(testId: string, api: JiraApi): Promise<Array<JiraIssue>> {
        const jql = `statusCategory!=${api.config.closedStatusCategoryName}+and+issuetype=bug+and+summary~"\\\\[${testId}\\\\]"`;
        const existingOpenIssues: Array<JiraIssue> = await api.searchIssues(jql);
        return existingOpenIssues;
    }

    /**
     * adds a comment specifying that the test is passing and then marks the Jira issue
     * as closed by editing it's status
     * @param testId the ID of the passing test
     * @param issueKey the Jira Issue identifier like: `ABCD-1234`
     * @param api a `JiraApi` instance
     */
    public static async closeIssue(testId: string, issueKey: string, api: JiraApi): Promise<void> {
        await api.setIssueStatus(issueKey, api.config.closedStatusCategoryName);
        await api.addCommentToIssue(issueKey, `${testId} passing so marking this issue as closed`);
    }
}