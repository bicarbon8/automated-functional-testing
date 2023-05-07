import { ILoggingPlugin, TestResult, LogMessageData, LogLevel, AftConfig, ConfigManager, configMgr } from "../../../src";

export class MockLoggingPluginConfig {
    mockConfigKey: string;
    enabled: boolean;
    level: LogLevel;
};

export class MockLoggingPlugin implements ILoggingPlugin {
    public readonly pluginType: string = 'logging';
    public readonly cfgMgr: ConfigManager;
    get enabled(): boolean {
        var cfg = this.cfgMgr.getSection(MockLoggingPluginConfig);
        return cfg.enabled ?? false;
    }
    get level(): LogLevel {
        var cfg = this.cfgMgr.getSection(MockLoggingPluginConfig);
        return cfg.level ?? this.cfgMgr.getSection(AftConfig)
            .logLevel ?? 'warn';
    }
    constructor(cfgMgr?: ConfigManager) {
        this.cfgMgr = cfgMgr ?? configMgr;
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