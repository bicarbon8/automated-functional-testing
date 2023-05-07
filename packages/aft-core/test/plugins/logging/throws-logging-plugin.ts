import { ILoggingPlugin, TestResult, LogMessageData, LogLevel, ConfigManager, configMgr } from "../../../src";

export class ThrowsLoggingPlugin implements ILoggingPlugin {
    public readonly cfgMgr: ConfigManager;
    public readonly pluginType: 'logging';
    get enabled(): boolean {
        return true;
    }
    get logLevel(): LogLevel {
        return 'trace';
    }
    constructor(cfgMgr?: ConfigManager) {
        this.cfgMgr = cfgMgr ?? configMgr;
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