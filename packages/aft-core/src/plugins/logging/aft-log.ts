import { cloneDeep } from "lodash";
import * as colors from "colors";
import { ILoggingPlugin } from "./i-logging-plugin";
import { LogLevel } from "./log-level";
import { LogMessageData } from "./log-message-data";
import { TestResult } from "../test-cases/test-result";
import { ellide } from "../../helpers/ellide";
import { ConfigManager, configMgr } from "../../configuration/config-manager";
import { AftConfig } from "../../configuration/aft-config";
import { pluginloader } from "../plugin-loader";

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
 *   "AftConfig": {
 *     "logLevel": "info"
 *   }
 *   ...
 * }
 * ```
 * NOTE: multiple instances of this class are expected to be created as each instance should have a unique
 * `logName` associated with it. Ex:
 * ```typescript
 * let logMgr1: AftLog = new AftLog({logName: 'logger for test 1'});
 * let logMgr2: AftLog = new AftLog({logName: 'logger for test 2'});
 * ```
 */
export class AftLog {
    readonly plugins: Array<ILoggingPlugin>;
    private readonly _cfgMgr: ConfigManager;
    private _stepCount: number = 0;

    /**
     * a name unique to a given logging instance intended to uniquely identify logs by
     * either the associated test or class doing the logging
     */
    public readonly logName: string;
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
    public readonly logLevel: LogLevel;

    constructor(logName: string, cfgMgr?: ConfigManager) {
        this.logName = logName;
        this._cfgMgr = cfgMgr ?? configMgr;
        this.logLevel = this._cfgMgr.getSection(AftConfig).logLevel ?? 'warn';
        this.plugins = pluginloader.getPluginsByType<ILoggingPlugin>('logging', this._cfgMgr);
        this.plugins.forEach((p: ILoggingPlugin) => {
            p?.initialise(logName)?.catch((err) => AftLog.toConsole({
                logLevel: 'warn',
                message: err,
                name: logName
            }));
        })
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
        const logdata: LogMessageData = {name: this.logName, logLevel: this.logLevel, message: message};
        if (LogLevel.toValue(level) >= LogLevel.toValue(this.logLevel) && level != 'none') {
            AftLog.toConsole(logdata);
        }
        for (var plugin of this.plugins) {
            try {
                await plugin?.log({...logdata});
            } catch (e) {
                AftLog.toConsole({
                    logLevel: 'warn',
                    message: `unable to send log message to '${plugin?.constructor.name || 'unknown'}' due to: ${e}`,
                    name: this.logName
                });
            }
        }
    }

    /**
     * function will send the passed in `TestResult` to any loaded `LoggingPlugin` objects
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async logResult(result: TestResult): Promise<void> {
        const name = this.logName;
        for (var plugin of this.plugins) {
            try {
                await plugin?.logResult(name, cloneDeep(result));
            } catch (e) { 
                AftLog.toConsole({
                    logLevel: 'warn',
                    message: `unable to send result to '${plugin?.constructor.name || 'unknown'}' due to: ${e}`,
                    name: name
                });
            }
        }
    }

    /**
     * loops through any loaded `LoggingPlugin` objects and calls
     * their `dispose` function. This should be called upon completion
     * of any logging actions before destroying the `LogManager` instance
     */
    async dispose(error?: Error): Promise<void> {
        const name = this.logName;
        for (var plugin of this.plugins) {
            try {
                await plugin?.finalise(name);
            } catch (e) {
                AftLog.toConsole({
                    logLevel: 'warn',
                    message: `unable to call dispose on '${plugin?.constructor.name || 'unknown'}' due to: ${e}`,
                    name: name
                });
            }
        }
        if (error) {
            AftLog.toConsole({
                logLevel: 'error',
                message: error.message,
                name: name
            });
        }
    }
}

export module AftLog {
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
        if (!message.logLevel) { message.logLevel = 'none' }
        let d: string = new Date().toLocaleTimeString();
        let out: string = `${d} - [${message.name}] - ${ellide(message.logLevel.toUpperCase(), 5, 'end', '')} - ${message.message}`;
        return out;
    }
    /**
     * calls `LogManager.format` on the passed in `LogMessage` and then logs the 
     * resulting string to the console with colours based on the `LogMessage.level`
     * @param message a `LogMessage` object containing the values to be logged to
     * the console
     */
    export function toConsole(message?: LogMessageData) {
        if (message?.message && message?.logLevel != 'none') {
            const out: string = AftLog.format(message);
            switch (message?.logLevel) {
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