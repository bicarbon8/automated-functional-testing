import { AbstractLoggingPlugin, LoggingLevel, ITestResult, EllipsisLocation, ellide, ILoggingPluginOptions } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailResultRequest } from "../api/testrail-result-request";
import { TestRailPlan } from "../api/testrail-plan";
import { TestRailConfig, trconfig } from "../configuration/testrail-config";
import { StatusConverter } from "../helpers/status-converter";
import { nameof } from "ts-simple-nameof";

export interface TestRailLoggingPluginOptions extends ILoggingPluginOptions {
    maxLogCharacters?: number;

    _config?: TestRailConfig;
    _client?: TestRailApi;
}

/**
 * NOTE: this plugin references configuration from the `aftconfig.json` file
 * under a name of `testrailloggingplugin`. Ex:
 * ```json
 * {
 *   "testrailloggingplugin": {
 *     "level": "warn",
 *     "maxLogCharacters": 300
 *   }
 * }
 * ```
 */
export class TestRailLoggingPlugin extends AbstractLoggingPlugin {
    private _logs: string;
    private _config: TestRailConfig;
    private _client: TestRailApi;
    private _maxLogChars: number;
    
    constructor(options?: TestRailLoggingPluginOptions) {
        super(nameof(TestRailLoggingPlugin).toLowerCase(), options);
        this._logs = '';
        
        this._config = options?._config || trconfig;
        this._client = options?._client || new TestRailApi(this._config);
    }

    async onLoad(): Promise<void> {
        // create new Test Plan if one doesn't already exist
        if (await this.enabled() && (await this._config.getPlanId() <= 0)) {
            let projectId: number = await this._config.getProjectId();
            let suiteIds: number[] = await this._config.getSuiteIds();
            let plan: TestRailPlan = await this._client.createPlan(projectId, suiteIds);
            this._config.setPlanId(plan.id);
        }
    }

    async getMaxLogCharacters(): Promise<number> {
        if (this._maxLogChars === undefined) {
            this._maxLogChars = await this.optionsMgr.getOption(nameof<TestRailLoggingPluginOptions>(o => o.maxLogCharacters), 250);
        }
        return this._maxLogChars;
    }

    async log(level: LoggingLevel, message: string): Promise<void> {
        if (await this.enabled()) {
            let l: LoggingLevel = await this.level();
            if (level.value >= l.value) {
                if (this._logs.length > 0) {
                    this._logs += '\n'; // separate new logs from previous
                }
                this._logs += message;
                this._logs = ellide(this._logs, await this.getMaxLogCharacters(), EllipsisLocation.beginning);
            }
        }
    }
    
    async logResult(result: ITestResult): Promise<void> {
        if (await this.enabled() && result) {
            let planId: number = await this._config.getPlanId();
            let trResult: TestRailResultRequest = await this._getTestRailResultForExternalResult(result);
            await this._client.addResult(result.testId, planId, trResult);
        }
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }

    private _getLogs(): string {
        return this._logs;
    }

    private async _getTestRailResultForExternalResult(result: ITestResult): Promise<TestRailResultRequest> {
        let maxChars: number = await this.getMaxLogCharacters();
        let elapsed: number = 0;
        if (result.metadata) {
            let millis: number = result.metadata['durationMs'] || 0;
            elapsed = Math.floor(millis / 60000); // elapsed is in minutes
        }
        let trResult: TestRailResultRequest = {
            comment: ellide(`${this._getLogs()}\n${result.resultMessage}`, maxChars, EllipsisLocation.beginning),
            defects: result.defects?.join(','),
            elapsed: elapsed.toString(),
            status_id: StatusConverter.instance.toTestRailStatus(result.status)
        };

        return trResult;
    }
}