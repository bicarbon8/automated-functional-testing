import { cloneDeep } from "lodash";
import { LoggingPlugin, LoggingPluginOptions } from "./logging-plugin";
import { LoggingLevel } from "./logging-level";
import { FormatOptions } from "./format-options";
import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { convert } from "../../helpers/converter";
import { ITestResult } from "../test-cases/itest-result";
import * as colors from "colors";

export interface LogManagerOptions extends PluginManagerOptions, LoggingPluginOptions {

}

/**
 * a logging class that uses configuration to determine what
 * should be logged to the console and formats the logging output
 * to indicate the source of the logging data. Additionally this
 * class manages logging plugins and serves as the interface for 
 * sending `TestResult` data to `LoggingPlugin` instances.
 * Configuration for this class can be passed in directly or 
 * specified in `aftconfig.json` like:
 * ```
 * {
 *   ...
 *   "logmanager": {
 *     "level": "info",
 *     "pluginNames": [
 *       "logging-plugin1",
 *       "logging-plugin2"
 *     ]
 *   }
 *   ...
 * }
 * ```
 * NOTE: multiple instances of this class are expected to be created as each instance should have a unique
 * {logName} associated with it. Ex:
 * ```typescript
 * let logMgr1: LogManager = new LogManager({logName: 'logger for test 1'});
 * let logMgr2: LogManager = new LogManager({logName: 'logger for test 2'});
 * ```
 */
export class LogManager extends PluginManager<LoggingPlugin, LoggingPluginOptions> {
    private _logName: string;
    private _level: LoggingLevel;
    private _stepCount: number = 0;

    constructor(options?: LogManagerOptions) {
        super(options);
    }

    async logName(): Promise<string> {
        if (!this._logName) {
            this._logName = convert.toSafeString(await this.optionsMgr.get('logName'));
        }
        return this._logName;
    }

    async level(): Promise<LoggingLevel> {
        if (!this._level) {
            let lvl: string = await this.optionsMgr.get('level', LoggingLevel.none.name);
            this._level = LoggingLevel.parse(lvl);
        }
        return this._level;
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Trace}
     * @param message the message to be logged
     */
    async trace(message: string): Promise<void> {
        await this.log(LoggingLevel.trace, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Debug}
     * @param message the message to be logged
     */
    async debug(message: string): Promise<void> {
        await this.log(LoggingLevel.debug, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Info}
     * @param message the message to be logged
     */
    async info(message: string): Promise<void> {
        await this.log(LoggingLevel.info, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Step}
     * @param message the message to be logged
     */
    async step(message: string): Promise<void> {
        await this.log(LoggingLevel.step, ++this._stepCount + ': ' + message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Warn}
     * @param message the message to be logged
     */
    async warn(message: string): Promise<void> {
        await this.log(LoggingLevel.warn, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Pass}
     * @param message the message to be logged
     */
    async pass(message: string): Promise<void> {
        await this.log(LoggingLevel.pass, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Fail}
     * @param message the message to be logged
     */
    async fail(message: string): Promise<void> {
        await this.log(LoggingLevel.fail, message);
    }

    /**
     * calls the {log} function with a {level} of {LoggingLevel.Error}
     * @param message the message to be logged
     */
    async error(message: string): Promise<void> {
        await this.log(LoggingLevel.error, message);
    }

    /**
     * function will send the {level} and {message} on to any 
     * loaded {AbstractLoggingPlugin} objects
     * @param level the `LoggingLevel` of this message
     * @param message the string to be logged
     */
    async log(level: LoggingLevel, message: string): Promise<void> {
        let lvl: LoggingLevel = await this.level();
        if (level.value >= lvl.value && level != LoggingLevel.none) {
            await this._out(level, message);
        }
        let plugins: LoggingPlugin[] = await this.getEnabledPlugins();
        for (var i=0; i<plugins.length; i++) {
            let p: LoggingPlugin = plugins[i];
            if (p) {
                try {
                    await p.log(level, message);
                } catch (e) {
                    console.warn(LogManager.format({
                        name: await this.logName(), 
                        level: LoggingLevel.warn, 
                        message: `unable to send log message to '${p?.constructor?.name || 'unknown'}' plugin due to: ${e}`
                    }));
                }
            }
        }
    }

    /**
     * function will send the passed in {ITestResult} to any loaded {AbstractLoggingPlugin} objects
     * allowing them to process the result
     * @param result a {ITestResult} object to be sent
     */
    async logResult(result: ITestResult): Promise<void> {
        let plugins: LoggingPlugin[] = await this.getEnabledPlugins();
        for (var i=0; i<plugins.length; i++) {
            let p: LoggingPlugin = plugins[i];
            if (p) {
                try {
                    let r: ITestResult = cloneDeep(result);
                    await p.logResult(r);
                } catch (e) {
                    console.warn(LogManager.format({
                        name: await this.logName(),
                        level: LoggingLevel.warn, 
                        message: `unable to send result to Logging Plugin: '${p.constructor.name || 'unknown'}' due to: ${e}`
                    }));
                }
            }
        }
    }

    /**
     * loops through any loaded {AbstractLoggingPlugin} objects and calls
     * their {dispose} function. This should be called upon completion
     * of any logging actions before destroying the {LogManager} instance
     */
    async dispose(error?: Error): Promise<void> {
        let plugins: LoggingPlugin[] = await this.getPlugins();
        for (var i=0; i<plugins.length; i++) {
            let p: LoggingPlugin = plugins[i];
            try {
                await p.dispose(error);
            } catch (e) {
                console.warn(LogManager.format({
                    name: await this.logName(), 
                    level: LoggingLevel.warn, 
                    message: `unable to call finalise on Logging Plugin: ${p.constructor.name || 'unknown'} due to: ${e}`
                }));
            }
        }
    }

    private async _out(level: LoggingLevel, message: string): Promise<void> {
        const opt: FormatOptions = {
            name: await this.logName(),
            message: message,
            level: level
        };
        let out: string = LogManager.format(opt);
        switch (opt.level) {
            case LoggingLevel.error:
            case LoggingLevel.fail:
                console.log(colors.red(out));
                break;
            case LoggingLevel.warn:
                console.log(colors.yellow(out));
                break;
            case LoggingLevel.info:
                console.log(colors.white(out));
                break;
            case LoggingLevel.pass:
                console.log(colors.green(out));
                break;
            case LoggingLevel.step:
                console.log(colors.magenta(out));
                break;
            case LoggingLevel.trace:
            case LoggingLevel.debug:
                console.log(colors.blue(out));
                break;
            case LoggingLevel.none:
                break;
            default:
                console.log(colors.gray(out));
                break;
        }
    }
}

export module LogManager {
    export function format(options?: FormatOptions) {
        options = options || {};
        if (!options.name) { options.name = '[AFT]'; }
        if (!options.message) { options.message = ''; }
        if (!options.level) { options.level = LoggingLevel.none }
        let d: string = new Date().toLocaleTimeString();
        let out: string = `${d} - ${options.name} - ${options.level.logString} - ${options.message}`;
        return out;
    }
}