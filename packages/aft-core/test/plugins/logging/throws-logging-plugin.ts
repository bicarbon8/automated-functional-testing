import { ILoggingPlugin, TestResult, LogMessageData, LogLevel, AftConfig, aftConfig } from "../../../src";

export class ThrowsLoggingPlugin implements ILoggingPlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: 'logging' = 'logging';
    get enabled(): boolean {
        throw 'enabled exception';
    }
    get logLevel(): LogLevel {
        throw 'logLevel exception';
    }
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }
    async initialise(logName: string): Promise<void> {
        throw 'initialise exception';
    }
    async log(messageData: LogMessageData): Promise<void> {
        throw 'log exception';
    }
    async logResult(name: string, result: TestResult): Promise<void> {
        throw 'logResult exception';
    }
    async finalise(name: string, error?: Error): Promise<void> {
        throw 'dispose exception';
    }
}