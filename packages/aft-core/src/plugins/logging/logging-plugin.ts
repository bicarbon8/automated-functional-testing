import { Plugin, PluginOptions } from "../plugin";
import { ITestResult } from "../test-cases/itest-result";
import { LoggingLevel } from "./logging-level";
import { rand } from "../../helpers/random-generator";

export interface LoggingPluginOptions extends PluginOptions {
    logName?: string;
    level?: string;
}

export abstract class LoggingPlugin extends Plugin<LoggingPluginOptions> {
    private _name: string;
    private _level: LoggingLevel;
    constructor(options?: LoggingPluginOptions) {
        super(options);
    }
    async logName(): Promise<string> {
        if (!this._name) {
            this._name = await this.optionsMgr.get('logName', `${this.constructor.name}_${rand.guid}`);
        }
        return this._name;
    }
    async level(): Promise<LoggingLevel> {
        if (!this._level) {
            let lvl: string = await this.optionsMgr.get('level', LoggingLevel.none.name);
            this._level = LoggingLevel.parse(lvl);
        }
        return this._level;
    }
    abstract log(level: LoggingLevel, message: string): Promise<void>;
    abstract logResult(result: ITestResult): Promise<void>;
}