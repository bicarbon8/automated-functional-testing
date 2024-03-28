import { ReportingPlugin, LogLevel, TestResult, ellide, AftConfig, Err } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailResultRequest } from "../api/testrail-custom-types";
import { TestRailConfig } from "../configuration/testrail-config";
import { statusConverter } from "../helpers/status-converter";
import { PlanId } from "../helpers/plan-id";


/**
 * this plugin uses the following configuration to control its operation via
 * `aftconfig.json` and if the `logLevel` is unset it will be set from the value 
 * in `ReporterConfig` before falling back to a value of `warn`
 * ```json
 * {
 *     "TestRailConfig": {
 *         "logLevel": "warn",
 *         "maxLogCharacters": 300,
 *         "planId": 1234,
 *         "projectId": 12,
 *         "suiteIds": [34, 567]
 *     }
 * }
 * ```
 * > NOTE: if no value is set for `planId` and a `logLevel` value other than `none` is used
 * then a new TestRail Plan will be created from the specified `projectId` and `suiteIds`
 * configuration keys
 */
export class TestRailReportingPlugin extends ReportingPlugin {
    private readonly _level: LogLevel;
    public override get logLevel(): LogLevel {
        return this._level;
    }

    private readonly _logs: Map<string, string>;
    private readonly _api: TestRailApi;
    private readonly _maxLogChars: number;
    
    constructor(aftCfg?: AftConfig, api?: TestRailApi) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(TestRailConfig);
        this._level = cfg.logLevel ?? this.aftCfg.logLevel ?? 'warn';
        if (this.enabled) {
            this._logs = new Map<string, string>();
            this._api = api ?? new TestRailApi(this.aftCfg);
            this._maxLogChars = cfg.maxLogCharacters ?? 250;
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

    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        if (this.enabled) {
            if (LogLevel.toValue(level) >= LogLevel.toValue(this.logLevel) && level != 'none') {
                let logs = this.logs(name);
                if (logs.length > 0) {
                    logs += '\n'; // separate new logs from previous
                }
                const dataStr: string = (data?.length) ? `, [${data.map(d => Err.handle(() => JSON.stringify(d))).join('')}]` : '';
                logs += `${message}${dataStr}`;
                logs = ellide(logs, this._maxLogChars, 'beginning');
                this.logs(name, logs);
            }
        }
    }
    
    override submitResult = async (name: string, result: TestResult): Promise<void> => {
        if (this.enabled && result && name) {
            const trResult: TestRailResultRequest = await this._getTestRailResultForTestResult(name ?? result.testName, result);
            const planId = await PlanId.get(this.aftCfg, this._api);
            await this._api.addResult(result.testId, planId, trResult);
        }
    }

    override finalise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }

    private async _getTestRailResultForTestResult(logName: string, result: TestResult): Promise<TestRailResultRequest> {
        let maxChars: number = this._maxLogChars;
        let elapsed: number = 0;
        if (result.metadata) {
            let millis: number = result.metadata['durationMs'] || 0;
            elapsed = Math.floor(millis / 60000); // elapsed is in minutes
        }
        const logs = this.logs(logName);
        let trResult: TestRailResultRequest = {
            comment: ellide(`${logs}\n${result.resultMessage}`, maxChars, 'beginning'),
            elapsed: elapsed.toString(),
            status_id: statusConverter.toTestRailStatus(result.status)
        };

        return trResult;
    }
}