import { ReportingPlugin } from "./reporting-plugin";
import { LogLevel } from "../../logging/log-level";
import { AftConfig } from "../../configuration/aft-config";
import { pluginLoader } from "../plugin-loader";
import { AftLogger, aftLogger } from "../../logging/aft-logger";
import { TestResult } from "./test-result";
import { Err } from "../../helpers/err";
import { cloneDeep } from "lodash";

/**
 * a class that manages reporting plugins.
 * Configuration for this class can be passed in directly or 
 * specified in `aftconfig.json` like:
 * ```
 * // aftconfig.json
 * {
 *   ...
 *   "logLevel": "info"
 *   ...
 * }
 * ```
 * NOTE: multiple instances of this class are expected to be created as each instance should have a unique
 * `reporterName` associated with it. Ex:
 * ```typescript
 * const r1 = new Reporter('reporter for test 1');
 * const r2 = new Reporter('reporter for test 2');
 * ```
 */
export class Reporter {
    readonly plugins: Array<ReportingPlugin>;
    private readonly _aftLogger: AftLogger;
    private _stepCount: number = 0;

    /**
     * a name unique to a given reporter instance intended to uniquely identify output by
     * either the associated test or class doing the reporting
     */
    public readonly reporterName: string;
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

    constructor(logName: string, aftCfg?: AftConfig) {
        this.reporterName = logName ?? 'AFT';
        this._aftLogger = (aftCfg) ? new AftLogger(aftCfg) : aftLogger;
        this.logLevel = this._aftLogger.logLevel;
        this.plugins = pluginLoader.getPluginsByType(ReportingPlugin, this._aftLogger.aftCfg);
        this.plugins.filter(p => {
            try {
                return p?.enabled;
            } catch (e) {
                return false;
            }
        }).forEach((p: ReportingPlugin) => {
            p?.initialise(logName)?.catch((err) => this._aftLogger.log({
                level: 'warn',
                message: err,
                name: logName
            }));
        })
    }

    /**
     * calls the `log` function with a `LogLevel` of `trace`
     * @param message the message to be logged
     */
    async trace(message: string, ...data: Array<any>): Promise<void> {
        await this.log('trace', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `debug`
     * @param message the message to be logged
     */
    async debug(message: string, ...data: Array<any>): Promise<void> {
        await this.log('debug', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `info`
     * @param message the message to be logged
     */
    async info(message: string, ...data: Array<any>): Promise<void> {
        await this.log('info', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `step`
     * @param message the message to be logged
     */
    async step(message: string, ...data: Array<any>): Promise<void> {
        await this.log('step', ++this._stepCount + ': ' + message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `warn`
     * @param message the message to be logged
     */
    async warn(message: string, ...data: Array<any>): Promise<void> {
        await this.log('warn', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `pass`
     * @param message the message to be logged
     */
    async pass(message: string, ...data: Array<any>): Promise<void> {
        await this.log('pass', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `fail`
     * @param message the message to be logged
     */
    async fail(message: string, ...data: Array<any>): Promise<void> {
        await this.log('fail', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `error`
     * @param message the message to be logged
     */
    async error(message: string, ...data: Array<any>): Promise<void> {
        await this.log('error', message, ...data);
    }

    /**
     * function will send the `LogLevel` and `message` on to any 
     * loaded `ReportingPlugin` objects
     * @param level the `LogLevel` of this message
     * @param message the string to be logged
     * @param data an array of additional data to be included in the logs
     */
    async log(level: LogLevel, message: string, ...data: any[]): Promise<void> {
        this._aftLogger.log({
            name: this.reporterName, 
            level, 
            message, 
            args: data
        });
        for (var plugin of this.plugins.filter(p => {
            try{
                return p?.enabled;
            } catch (e) {
                /* ignore */
            }
        })) {
            try {
                await plugin?.log(this.reporterName, level, message, ...data);
            } catch (e) {
                this._aftLogger.log({
                    level: 'warn',
                    message: `unable to send log message to '${plugin?.constructor.name || 'unknown'}' due to: ${e}`,
                    name: this.reporterName
                });
            }
        }
    }

    /**
     * function will send the passed in `TestResult` to any loaded `IResultsPlugin` implementations
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async submitResult(result: TestResult): Promise<void> {
        for (var plugin of this.plugins.filter(p => Err.handle(() => p?.enabled))) {
            try {
                await plugin?.submitResult(this.reporterName, cloneDeep(result));
            } catch (e) { 
                this._aftLogger.log({
                    level: 'warn',
                    message: `unable to send result to '${plugin?.constructor.name || 'unknown'}' due to: ${Err.short(e)}`,
                    name: result?.testName ?? this.constructor.name
                });
            }
        }
    }

    /**
     * loops through any loaded `ReportingPlugin` objects and calls
     * their `dispose` function. This should be called upon completion
     * of any logging actions before destroying the `AftLogger` instance
     */
    async dispose(error?: Error): Promise<void> {
        const name = this.reporterName;
        for (var plugin of this.plugins.filter(p => {
            try{
                return p?.enabled;
            } catch {
                /* ignore */
            }
        })) {
            try {
                await plugin?.finalise(name);
            } catch (e) {
                this._aftLogger.log({
                    level: 'warn',
                    message: `unable to call dispose on '${plugin?.constructor.name || 'unknown'}' due to: ${e}`,
                    name: name
                });
            }
        }
        if (error) {
            this._aftLogger.log({
                level: 'error',
                message: error.message,
                name: name
            });
        }
    }
}