import { LogLevel, ReportingPluginConfig } from "aft-core";

/**
 * reads configuration from either the passed in `TestRailConfigOptions`
 * or the `aftconfig.json` file under a heading of `testrailconfig` like:
 * ```json
 * {
 *   "TestRailConfig": {
 *     "url": "https://your-instance-of.testrail.io",
 *     "user": "your-username@your-company.com",
 *     "accesskey": "your-access-key-for-testrail",
 *     "projectid": 123,
 *     "suiteids": [234, 345, 456],
 *     "planid": 123456
 *   }
 * }
 * ```
 * #### NOTE:
 * > - `projectid` and `suiteids` are only used if no `planid` is specified
 * > - if `TestRailReportingPlugin` is in use and no `planid` is specified a new
 * TestRail plan will be created and the value stored in a shared file for access
 * by other processes and subsequent test executions
 */
export class TestRailConfig extends ReportingPluginConfig {
    public url: string;
    public user: string;
    public accessKey: string;
    public projectId: number;
    public suiteIds: number[] = [];
    public planId: number;
    public cacheDuration: number = 300000;
    public override logLevel: LogLevel = 'warn';
    public maxLogCharacters: number = 250;
    public policyEngineEnabled: boolean = true;
}