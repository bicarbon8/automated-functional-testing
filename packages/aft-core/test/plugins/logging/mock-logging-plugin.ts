import { LoggingPlugin, TestResult, LogMessageData, Merge, LoggingPluginOptions } from "../../../src";

export type MockLoggingPluginOptions = Merge<LoggingPluginOptions, {
    mockConfigKey: string;
}>;

export class MockLoggingPlugin extends LoggingPlugin<MockLoggingPluginOptions> {
    override async log(message: LogMessageData): Promise<void> {
        return Promise.resolve();
    }
    override async logResult(name: string, result: TestResult): Promise<void> {
        return Promise.resolve();
    }
    override async dispose(name: string, error?: Error): Promise<void> {
        return Promise.resolve();
    }
}