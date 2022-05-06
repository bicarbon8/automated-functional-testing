import { LoggingPluginStore } from "./logging-plugin-store";
import { LogMessage } from "./log-message";
import { LoggingPlugin, LoggingPluginOptions, ITestResult, LoggingLevel } from "../../../src";

export class MockLoggingPlugin extends LoggingPlugin {
    private _lps: LoggingPluginStore;
    
    constructor(options?: LoggingPluginOptions) {
        super(options);
    }

    async lps(): Promise<LoggingPluginStore> {
        if (!this._lps) {
            this._lps = await this.optionsMgr.getOption('lps', null);
        }
        return this._lps;
    }
    async onLoad(): Promise<void> {
        const lps = await this.lps();
        lps.onLoad = true;
        const lvl = await this.level();
        lps.lvl = lvl;
    }
    async log(level: LoggingLevel, message: string): Promise<void> {
        const lps = await this.lps();
        if (!lps.logs?.length) {
            lps.logs = [];
        }
        lps.logs.push(new LogMessage(level, message));
    }
    async logResult(result: ITestResult): Promise<void> {
        const lps = await this.lps();
        if (!lps.results?.length) {
            lps.results = [];
        }
        lps.results.push(result);
    }
    async dispose(error?: Error): Promise<void> {
        await this.lps().then((lps: LoggingPluginStore) => { lps.disposed = true; });
    }
}