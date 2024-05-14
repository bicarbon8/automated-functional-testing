import { ReportingPlugin, TestResult, AftConfig, Err, LogMessageData } from "aft-core";
import { JiraApi } from "../api/jira-api";
import { JiraConfig } from "../configuration/jira-config";
import { CommonActions } from "../helpers/common-actions";

/**
 * this plugin uses the following configuration to control its operation via
 * `aftconfig.json`
 * ```json
 * {
 *     "JiraConfig": {
 *         "url": "https://your.jira.inst",
 *         "user": "you@jira.com",
 *         "accessKey": "your-jira-api-token",
 *         "openDefectOnFail": true,
 *         "closeDefectOnPass": true
 *     }
 * }
 * ```
 * #### NOTE:
 * > if `openDefectOnFail` and `closeDefectOnPass` are both `false` this plugin will
 * be disabled
 */
export class JiraReportingPlugin extends ReportingPlugin {
    private readonly _api: JiraApi;
    private readonly _openOnFail: boolean;
    private readonly _closeOnPass: boolean;
    private readonly _logs: Map<string, string>;

    override get enabled(): boolean {
        return  this._openOnFail || this._closeOnPass;
    }
    
    constructor(aftCfg?: AftConfig, api?: JiraApi) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(JiraConfig);
        this._openOnFail = cfg.openDefectOnFail ?? false;
        this._closeOnPass = cfg.closeDefectOnPass ?? false;
        if (this.enabled) {
            this._api = api ?? new JiraApi(this.aftCfg);
            this._logs = new Map<string, string>();
        }
    }

    logs(key: string, val?: string): string {
        if (!this._logs.has(key)) {
            this._logs.set(key, '');
        }
        if (val) {
            this._logs.set(key, val);
        }
        return this._logs.get(key);
    }

    override log = async (logData: LogMessageData): Promise<void> => {
        if (this.enabled) {
            let logs = this.logs(logData.name);
            if (logs.length > 0) {
                logs += '\n'; // separate new logs from previous
            }
            const dataStr: string = (logData.data?.length) ? `, [${logData.data.map(d => {
                const dHandled = Err.handle(() => JSON.stringify(d));
                return dHandled.result ?? dHandled.message;
            }).join('')}]` : '';
            logs += `${logData.message}${dataStr}`;
            this.logs(logData.name, logs);
        }
    }
    
    override submitResult = async (result: TestResult): Promise<void> => {
        if (this.enabled && result?.testId) {
            if (this._openOnFail && result.status === 'failed') {
                await this._openNewDefectOrUpdateExisting(result);
            }
            if (this._closeOnPass && result.status === 'passed') {
                await this._closeDefects(result);
            }
        }
    }

    override finalise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }

    private async _openNewDefectOrUpdateExisting(result: TestResult): Promise<void> {
        const openIssues = await CommonActions.getOpenIssuesReferencingTestId(result.testId, this._api);
        if (openIssues?.length) {
            this.aftLogger.log({
                name: this.constructor.name,
                level: 'trace',
                message: `adding comment to Jira issues: [${openIssues.map(i => i?.key).join(',')}] because test '${result.testId}' is still failing...`
            });
            // update comments to indicate the issue still exists
            for (const issue of openIssues) {
                await this._api.addCommentToIssue(issue.key, `test '${result.testId}' still failing due to: ${result.resultMessage}`);
            }
        } else {
            this.aftLogger.log({
                name: this.constructor.name,
                level: 'trace',
                message: `creating new Jira issue because test '${result.testId}' failed...`
            });
            // create a new defect
            await this._api.createIssue(result.testId, result.testName, this.logs(result.testName));
        }
    }

    private async _closeDefects(result: TestResult): Promise<void> {
        const openIssues = await CommonActions.getOpenIssuesReferencingTestId(result.testId, this._api);
        this.aftLogger.log({
            name: this.constructor.name,
            level: 'trace',
            message: `closing the following Jira issues due to passing test '${result.testId}': [${openIssues.map(i => i?.key).join(',')}]...`
        });
        for (const issue of openIssues) {
            await CommonActions.closeIssue(result.testId, issue.key, this._api);
        }
    }
}