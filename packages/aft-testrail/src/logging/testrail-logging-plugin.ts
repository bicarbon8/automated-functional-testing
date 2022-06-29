import { LoggingPlugin, LogLevel, TestResult, ellide, ExpiringFileLock, fileio, LogMessageData, Merge, LoggingPluginOptions } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailPlan, TestRailResultRequest } from "../api/testrail-custom-types";
import { TestRailConfig, trconfig } from "../configuration/testrail-config";
import { statusConverter } from "../helpers/status-converter";

export type TestRailLoggingPluginOptions = Merge<LoggingPluginOptions, {
    maxLogCharacters?: number;

    config?: TestRailConfig;
    api?: TestRailApi;
}>;

/**
 * NOTE: this plugin can accept the following options from the `LogManager` via
 * `aftconfig.json`
 * ```json
 * {
 *     "level": "warn",
 *     "maxLogCharacters": 300,
 *     "enabled": true
 * }
 * ```
 */
export class TestRailLoggingPlugin extends LoggingPlugin<TestRailLoggingPluginOptions> {
    private _logs: Map<string, string>;
    private _trConfig: TestRailConfig;
    private _api: TestRailApi;
    
    constructor(options?: TestRailLoggingPluginOptions) {
        super(options);
        this._logs = new Map<string, string>();
    }

    get config(): TestRailConfig {
        if (!this._trConfig) {
            this._trConfig = this.option('config') || trconfig;
        }
        return this._trConfig;
    }

    get api(): TestRailApi {
        if (!this._api) {
            this._api = this.option('api') || new TestRailApi({config: this.config});
        }
        return this._api;
    }

    get maxLogCharacters(): number {
        return this.option('maxLogCharacters', 250);
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

    override async log(data: LogMessageData): Promise<void> {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.level) && data.level != 'none') {
            let logs = this.logs(data.name);
            if (logs.length > 0) {
                logs += '\n'; // separate new logs from previous
            }
            logs += data.message;
            logs = ellide(logs, this.maxLogCharacters, 'beginning');
            this.logs(data.name, logs);
        }
    }
    
    override async logResult(logName: string, result: TestResult): Promise<void> {
        if (result) {
            await this._createTestPlanIfNone();
            const trResult: TestRailResultRequest = await this._getTestRailResultForExternalResult(logName, result);
            const planId = await this.config.planId();
            await this.api.addResult(result.testId, planId, trResult);
        }
    }

    override async dispose(logName: string, error?: Error): Promise<void> {
        this._logs.delete(logName);
    }

    private async _getTestRailResultForExternalResult(logName: string, result: TestResult): Promise<TestRailResultRequest> {
        let maxChars: number = this.maxLogCharacters;
        let elapsed: number = 0;
        if (result.metadata) {
            let millis: number = result.metadata['durationMs'] || 0;
            elapsed = Math.floor(millis / 60000); // elapsed is in minutes
        }
        const logs = this.logs(logName);
        let trResult: TestRailResultRequest = {
            comment: ellide(`${logs}\n${result.resultMessage}`, maxChars, 'beginning'),
            defects: result.defects?.join(','),
            elapsed: elapsed.toString(),
            status_id: statusConverter.toTestRailStatus(result.status)
        };

        return trResult;
    }

    private async _createTestPlanIfNone(): Promise<void> {
        const lock: ExpiringFileLock = fileio.getExpiringFileLock(this.constructor.name, 60000, 60000);
        try {
            // create new Test Plan if one doesn't already exist
            const planId: number = await this.config.planId();
            if (planId <= 0) {
                let projectId: number = await this.config.projectId();
                let suiteIds: number[] = await this.config.suiteIds();
                let plan: TestRailPlan = await this.api.createPlan(projectId, suiteIds);
                this.config.setPlanId(plan.id); // sets value in FileSystemMap that is read by `this.trConfig.planId()`
            }
        } finally {
            lock.unlock();
        }
    }
}