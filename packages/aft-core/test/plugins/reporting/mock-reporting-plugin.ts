import { AftReportingPlugin, LogLevel, AftConfig, AftReportingPluginConfig, TestResult } from "../../../src";

export class MockReportingPluginConfig extends AftReportingPluginConfig {
    mockConfigKey: string;
}

export class MockReportingPlugin extends AftReportingPlugin {
    public readonly results = new Array<TestResult>();
    private readonly _level: LogLevel;
    public override get logLevel(): LogLevel {
        return this._level;
    }
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockReportingPluginConfig);
        this._level = cfg.logLevel ?? this.aftCfg.logLevel ?? 'warn';
    }
    override initialise = async (logName: string): Promise<void> => {
        return Promise.resolve();
    }
    override log = async (name: string, level: LogLevel, message: string, ): Promise<void> => {
        return Promise.resolve();
    }
    override submitResult = async (name: string, result: TestResult): Promise<void> => {
        this.results.push(result);
        return Promise.resolve();
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        return Promise.resolve();
    }
}