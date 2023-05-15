import { LoggingPlugin, LogLevel, AftConfig, LogManagerConfig, LoggingPluginConfig } from "../../../src";

export class MockLoggingPluginConfig extends LoggingPluginConfig {
    mockConfigKey: string;
};

export class MockLoggingPlugin extends LoggingPlugin {
    private readonly _level: LogLevel;
    public override get logLevel(): LogLevel {
        return this._level;
    }
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        var cfg = this.aftCfg.getSection(MockLoggingPluginConfig);
        this._level = cfg.logLevel ?? this.aftCfg.getSection(LogManagerConfig)
            .logLevel ?? 'warn';
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