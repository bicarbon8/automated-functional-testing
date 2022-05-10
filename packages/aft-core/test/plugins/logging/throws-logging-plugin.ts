import { LoggingPlugin, LoggingPluginOptions, ITestResult, LogLevel } from "../../../src";

export class ThrowsLoggingPlugin extends LoggingPlugin {
    constructor(options?: LoggingPluginOptions) {
        super(options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async log(level: LogLevel, message: string): Promise<void> {
        throw 'log exception';
    }
    async logResult(result: ITestResult): Promise<void> {
        throw 'logResult exception';
    }
    async dispose(error?: Error): Promise<void> {
        throw 'dispose exception';
    }
}