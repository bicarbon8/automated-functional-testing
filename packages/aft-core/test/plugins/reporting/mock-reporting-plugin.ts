import { ReportingPlugin, LogLevel, AftConfig, ReportingPluginConfig, TestResult, LogMessageData } from "../../../src";

export class MockReportingPluginConfig extends ReportingPluginConfig {
    mockConfigKey: string;
}

export class MockReportingPlugin extends ReportingPlugin {
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
    override log = async (logData: LogMessageData): Promise<void> => {
        return Promise.resolve();
    }
    override submitResult = async (result: TestResult): Promise<void> => {
        this.results.push(result);
        return Promise.resolve();
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        return Promise.resolve();
    }
}