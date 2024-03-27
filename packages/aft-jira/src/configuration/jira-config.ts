import { PluginConfig } from "aft-core";

/**
 * reads configuration from either the passed in `JiraConfigOptions`
 * or the `aftconfig.json` file under a heading of `JiraConfig` like:
 * ```json
 * {
 *   "JiraConfig": {
 *     "url": "https://your-instance-of.jira.io",
 *     "accesskey": "your-access-key-for-jira",
 *     "policyEngineEnabled": true,
 *     "openDefectOnFail": false,
 *     "closeDefectOnPass": false,
 *     "projectKey": "ABCD",
 *     "closedStatusCategoryName": "Done"
 *   }
 * }
 * ```
 * NOTE:
 * - `openDefectOnFail` and `closeDefectOnPass` can be used to only create new
 * defects in certain environments or close defects following success in certain
 * environments
 * - if `policyEngineEnabled` is `true` then this `test-execution-policy` plugin
 * will be checked before tests are executed
 */
export class JiraConfig extends PluginConfig {
    public url: string;
    public accessKey: string;
    public cacheDuration: number = 300000;
    public policyEngineEnabled: boolean = true;
    public openDefectOnFail: boolean = false;
    public closeDefectOnPass: boolean = false;
    public projectKey: string;
    public closedStatusCategoryName: string = "Done";
    public override enabled: boolean = this.policyEngineEnabled || this.openDefectOnFail || this.closeDefectOnPass;
}
