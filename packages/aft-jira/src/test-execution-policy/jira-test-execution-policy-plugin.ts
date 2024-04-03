import { AftConfig, TestExecutionPolicyPlugin, ProcessingResult } from 'aft-core';
import { JiraApi } from '../api/jira-api';
import { JiraIssue } from '../api/jira-custom-types';
import { JiraConfig } from '../configuration/jira-config';
import { CommonActions } from '../helpers/common-actions';

/**
 * NOTE: this plugin has no configuration options as they are
 * all retrieved from `JiraConfig` under the `JiraConfig`
 * section of your `aftconfig.json` file
 */
export class JiraTestExecutionPolicyPlugin extends TestExecutionPolicyPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    
    private readonly _api: JiraApi;

    constructor(aftCfg?: AftConfig, api?: JiraApi) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(JiraConfig);
        this._enabled = cfg.policyEngineEnabled ?? true;
        if (this.enabled) {
            this._api = api ?? new JiraApi(this.aftCfg);
        }
    }

    /**
     * function will find a Jira Issue by searching for references to a supplied Test ID and if found
     * will return `true` if the `JiraIssue` is not open, otherwise `false`. if
     * no `JiraIssue` is found then `true` is returned
     * @param testId the Test ID used to search for references to within the Jira Issues
     */
    override shouldRun = async (testId: string): Promise<ProcessingResult<boolean>> => {
        if (this.enabled) {
            const openIssues: Array<JiraIssue> = await this._getIssuesReferencingTestIds(testId);
            this.aftLogger.log({
                level: 'debug',
                message: `found ${openIssues.length} open Jira issues for ${testId}: [${openIssues.map(i => i?.key).join(',')}]`,
                name: this.constructor.name
            });
            if (openIssues?.length > 0) {
                return {result: false, message: `'${testId}' referenced in open Jira Issue(s): [${openIssues.map(i => i?.key).join(',')}]`};
            }
            return {result: true, message: `'${testId}' not referenced in any open Jira Issues`};
        }
        return {result: true};
    }

    private async _getIssuesReferencingTestIds(...testIds: Array<string>): Promise<Array<JiraIssue>> {
        const openIssues = new Array<JiraIssue>();
        for (const id of testIds) {
            const issues = await CommonActions.getOpenIssuesReferencingTestId(id, this._api);
            openIssues.push(...issues);
        }
        return openIssues;
    }
}
