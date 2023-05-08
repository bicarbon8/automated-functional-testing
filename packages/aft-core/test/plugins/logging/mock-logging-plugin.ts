import { ILoggingPlugin, TestResult, LogMessageData, LogLevel, AftConfig, aftConfig } from "../../../src";

export class MockLoggingPluginConfig {
    mockConfigKey: string;
    enabled: boolean;
    logLevel: LogLevel;
};

export class MockLoggingPlugin implements ILoggingPlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "logging" = 'logging';
    get enabled(): boolean {
        return this.logLevel != 'none';
    }
    get logLevel(): LogLevel {
        var cfg = this.aftCfg.getSection(MockLoggingPluginConfig);
        return cfg.logLevel ?? this.aftCfg.getSection(AftConfig)
            .logLevel ?? 'warn';
    }
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }
    initialise(logName: string): Promise<void> {
        return Promise.resolve();
    }
    async log(message: LogMessageData): Promise<void> {
        return Promise.resolve();
    }
    async logResult(name: string, result: TestResult): Promise<void> {
        return Promise.resolve();
    }
    async finalise(name: string, error?: Error): Promise<void> {
        return Promise.resolve();
    }
}