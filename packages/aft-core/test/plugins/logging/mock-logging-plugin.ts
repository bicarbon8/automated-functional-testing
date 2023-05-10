import { LoggingPlugin, LogLevel, AftConfig, LogManagerConfig } from "../../../src";

export class MockLoggingPluginConfig {
    mockConfigKey: string;
    enabled: boolean;
    logLevel: LogLevel;
};

export class MockLoggingPlugin extends LoggingPlugin {
    public override readonly enabled: boolean;
    public override readonly logLevel: LogLevel;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        var cfg = this.aftCfg.getSection(MockLoggingPluginConfig);
        this.logLevel = cfg.logLevel ?? this.aftCfg.getSection(LogManagerConfig)
            .logLevel ?? 'warn';
        this.enabled = this.logLevel != 'none';
    }
    override initialise = async (logName: string): Promise<void> => {
        return Promise.resolve();
    }
    override log = async (name: string, level: LogLevel, message: string, ): Promise<void> => {
        return Promise.resolve();
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        return Promise.resolve();
    }
}