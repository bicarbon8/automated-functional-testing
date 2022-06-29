import { LoggingPlugin, TestResult, LogMessageData, LoggingPluginOptions } from "../../../src";

export class ThrowsLoggingPlugin extends LoggingPlugin<LoggingPluginOptions> {
    override async log(messageData: LogMessageData): Promise<void> {
        throw 'log exception';
    }
    override async logResult(name: string, result: TestResult): Promise<void> {
        throw 'logResult exception';
    }
    override async dispose(name: string, error?: Error): Promise<void> {
        throw 'dispose exception';
    }
}