import { cloneDeep } from "lodash";
import * as colors from "colors";
import { LoggingPlugin, LoggingPluginOptions } from "./logging-plugin";
import { LogLevel } from "./log-level";
import { LogMessageData } from "./log-message-data";
import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { TestResult } from "../test-cases/test-result";
import { ellide } from "../../helpers/ellide";
import { Disposable } from "../../helpers/disposable";
import { Merge } from "../../helpers/custom-types";
import { PluginConfig } from "../plugin-loader";

export type LogManagerOptions = Merge<PluginManagerOptions, LoggingPluginOptions, {
    logName: string;
}>;

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
 *     "plugins": [
 *       "logging-plugin1",
 *       {"name": "logging-plugin2", "enabled": false, "options": {"foo": "bar"}}
 *     ]
 *   }
 *   ...
 * }
 * ```
 * NOTE: multiple instances of this class are expected to be created as each instance should have a unique
 * `logName` associated with it. Ex:
 * ```typescript
 * let logMgr1: LogManager = new LogManager({logName: 'logger for test 1'});
 * let logMgr2: LogManager = new LogManager({logName: 'logger for test 2'});
 * ```
 */
export class LogManager extends PluginManager<LoggingPlugin<any>, LogManagerOptions> implements Disposable {
    private _stepCount: number = 0;

    constructor(options: LogManagerOptions) {
        super(options);
    }

    get logName(): string {
        return this.option('logName', 'AFT');
    }

    /**
     * allows for filtering out of erroneous information from logs by assigning
     * values to different types of logging. the purpose of each log level is
     * as follows:
     * - `trace` - used when logging low-level debug events that occur within a loop
     * - `debug` - used for debug logging that does not run within a loop or at a high frequency
     * - `info` - used for informational events providing current state of a system
     * - `step` - used within a test to denote where within the test steps we are
     * - `warn` - used for unexpected errors that are recoverable
     * - `pass` - used to indicate the success of a test expectation or assertion
     * - `fail` - used to indicate the failure of a test expectation or assertion
     * - `error` - used for unexpected errors that are **not** recoverable
     * - `none` - used when no logging is desired (disables logging)
     */
    async level(): Promise<LogLevel> {
        let lvl: string = await this.config('level', 'none');
        return (LogLevel.isType(lvl)) ? lvl as LogLevel : 'none';
    }

    /**
     * calls the `log` function with a `LogLevel` of `trace`
     * @param message the message to be logged
     */
    async trace(message: string): Promise<void> {
        await this.log('trace', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `debug`
     * @param message the message to be logged
     */
    async debug(message: string): Promise<void> {
        await this.log('debug', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `info`
     * @param message the message to be logged
     */
    async info(message: string): Promise<void> {
        await this.log('info', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `step`
     * @param message the message to be logged
     */
    async step(message: string): Promise<void> {
        await this.log('step', ++this._stepCount + ': ' + message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `warn`
     * @param message the message to be logged
     */
    async warn(message: string): Promise<void> {
        await this.log('warn', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `pass`
     * @param message the message to be logged
     */
    async pass(message: string): Promise<void> {
        await this.log('pass', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `fail`
     * @param message the message to be logged
     */
    async fail(message: string): Promise<void> {
        await this.log('fail', message);
    }

    /**
     * calls the `log` function with a `LogLevel` of `error`
     * @param message the message to be logged
     */
    async error(message: string): Promise<void> {
        await this.log('error', message);
    }

    /**
     * function will send the `LogLevel` and `message` on to any 
     * loaded `LoggingPlugin` objects
     * @param level the `LogLevel` of this message
     * @param message the string to be logged
     */
    async log(level: LogLevel, message: string): Promise<void> {
        const lvl: LogLevel = await this.level();
        const name = this.logName;
        const logdata: LogMessageData = {name: name, level: level, message: message};
        if (LogLevel.toValue(level) >= LogLevel.toValue(lvl) && level != 'none') {
            LogManager.toConsole(logdata);
        }
        return await this.enabled()
        .then((plugins: LoggingPlugin<any>[]) => plugins.forEach((p: LoggingPlugin<any>) => p?.log({...logdata})
            .catch((err) => LogManager.toConsole({
                level: 'warn',
                message: `unable to send log message to '${p?.constructor.name || 'unknown'}' due to: ${err}`,
                name: name
            }))))
        .catch((err) => LogManager.toConsole({
            level: 'warn', 
            message: `unable to send log message to LoggingPlugin due to: ${err}`,
            name: name
        }));
    }

    /**
     * function will send the passed in `TestResult` to any loaded `LoggingPlugin` objects
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async logResult(result: TestResult): Promise<void> {
        const name = this.logName;
        return await this.enabled()
        .then((plugins: LoggingPlugin<any>[]) => plugins.forEach((p: LoggingPlugin<any>) => p?.logResult(name, cloneDeep(result))
            .catch((err) => LogManager.toConsole({
                level: 'warn',
                message: `unable to send result to '${p?.constructor.name || 'unknown'}' due to: ${err}`,
                name: name
            }))))
        .catch((err) => LogManager.toConsole({
            level: 'warn', 
            message: `unable to send result to LoggingPlugin due to: ${err}`,
            name: name
        }));
    }

    /**
     * loops through any loaded `LoggingPlugin` objects and calls
     * their `dispose` function. This should be called upon completion
     * of any logging actions before destroying the `LogManager` instance
     */
    async dispose(error?: Error): Promise<void> {
        const name = this.logName;
        await this.enabled()
        .then((plugins: LoggingPlugin<any>[]) => plugins.forEach((p: LoggingPlugin<any>) => p?.dispose(name, error)
            .catch((err) => LogManager.toConsole({
                level: 'warn',
                message: `unable to call dispose on '${p?.constructor.name || 'unknown'}' due to: ${err}`,
                name: name
            }))))
        .catch((err) => LogManager.toConsole({
            level: 'warn', 
            message: `unable to dispose of LoggingPlugin due to: ${err}`,
            name: name
        }));
    }

    override async pluginConfigs(): Promise<Array<string | PluginConfig>> {
        const configs: Array<string | PluginConfig> = await this.config('plugins', []);
        const updatedConfigs: Array<PluginConfig> = new Array<PluginConfig>();
        for (var i=0; i<configs?.length; i++) {
            let maybeStringOrConfig = configs[i];
            if (maybeStringOrConfig) {
                let cfg: PluginConfig;
                if (typeof maybeStringOrConfig === 'string') {
                    cfg = {
                        name: maybeStringOrConfig, 
                        options: {}
                    };
                } else {
                    cfg = maybeStringOrConfig;
                }

                cfg.options = cfg.options || {};
                cfg.options['level'] = cfg.options['level'] || await this.level();
                updatedConfigs.push(cfg);
            }
        }
        return updatedConfigs;
    }
}

export module LogManager {
    /**
     * formats the passed in `LogMessage.message` based on the passed in options
     * @param message a `LogMessage` object containing the `level`, `name` and `message` to
     * be formatted into a console-friendly log string
     * @returns the formatted log string
     */
    export function format(message?: LogMessageData) {
        message = message || {};
        if (!message.name) { message.name = 'AFT'; }
        if (!message.message) { message.message = ''; }
        if (!message.level) { message.level = 'none' }
        let d: string = new Date().toLocaleTimeString();
        let out: string = `${d} - [${message.name}] - ${ellide(message.level.toUpperCase(), 5, 'end', '')} - ${message.message}`;
        return out;
    }
    /**
     * calls `LogManager.format` on the passed in `LogMessage` and then logs the 
     * resulting string to the console with colours based on the `LogMessage.level`
     * @param message a `LogMessage` object containing the values to be logged to
     * the console
     */
    export function toConsole(message?: LogMessageData) {
        if (message?.message && message?.level != 'none') {
            const out: string = LogManager.format(message);
            switch (message?.level) {
                case 'error':
                case 'fail':
                    console.log(colors.red(out));
                    break;
                case 'warn':
                    console.log(colors.yellow(out));
                    break;
                case 'info':
                    console.log(colors.white(out));
                    break;
                case 'pass':
                    console.log(colors.green(out));
                    break;
                case 'step':
                    console.log(colors.magenta(out));
                    break;
                case 'trace':
                case 'debug':
                    console.log(colors.blue(out));
                    break;
                default:
                    console.log(colors.gray(out));
                    break;
            }
        }
    }
}