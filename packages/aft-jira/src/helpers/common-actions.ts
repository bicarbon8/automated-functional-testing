import { JiraApi } from "../api/jira-api";
import { JiraIssue } from "../api/jira-custom-types";

export class CommonActions {
    private static CLOSED_STATUS = 3;

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
        const jql = `statusCategory!=${this.CLOSED_STATUS}+and+issuetype=bug+and+summary~[${testId}]`;
        const existingOpenIssues: Array<JiraIssue> = await api.searchIssues(jql);
        return existingOpenIssues;
    }

    /**
     * adds a comment specifying that the test is passing and then marks the Jira issue
     * as closed by editing it's status
     * @param testId the ID of the passing test
     * @param issueId the Jira Issue identifier
     * @param api a `JiraApi` instance
     */
    public static async closeIssue(testId: string, issueId: string, api: JiraApi): Promise<void> {
        await api.addCommentToIssue(issueId, `${testId} passing so marking this issue as closed`);
        await api.editIssue(issueId, new Map<string, string>([
            ["status", `${this.CLOSED_STATUS}`]
        ]));
    }
}