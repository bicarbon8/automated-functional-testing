import { Plugin, PluginOptions } from "../plugin";
import { ITestResult } from "../test-cases/itest-result";
import { LogLevel } from "./log-level";
import { rand } from "../../helpers/random-generator";

export interface LoggingPluginOptions extends PluginOptions {
    logName?: string;
    level?: string;
}

export abstract class LoggingPlugin extends Plugin<LoggingPluginOptions> {
    private _name: string;
    private _level: LogLevel;
    constructor(options?: LoggingPluginOptions) {
        super(options);
    }
    async logName(): Promise<string> {
        if (!this._name) {
            this._name = await this.optionsMgr.get('logName', `${this.constructor.name}_${rand.guid}`);
        }
        return this._name;
    }
    async level(): Promise<LogLevel> {
        if (!this._level) {
            let lvl: string = await this.optionsMgr.get('level', LogLevel.none.name);
            this._level = LogLevel.parse(lvl);
        }
        return this._level;
    }
    abstract log(level: LogLevel, message: string): Promise<void>;
    abstract logResult(result: ITestResult): Promise<void>;
}