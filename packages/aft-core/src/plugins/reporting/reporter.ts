import { AftReporterPlugin } from "./reporting-plugin";
import { LogLevel } from "../../logging/log-level";
import { AftConfig } from "../../configuration/aft-config";
import { pluginLoader } from "../plugin-loader";
import { AftLogger } from "../../logging/aft-logger";
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
export class Reporter extends AftLogger {
    readonly plugins: Array<AftReporterPlugin>;
    private _stepCount = 0;

    constructor(logName: string, aftCfg?: AftConfig) {
        super(logName, aftCfg);
        this.plugins = pluginLoader.getEnabledPluginsByType(AftReporterPlugin, this.aftCfg);
        this.plugins.forEach((p: AftReporterPlugin) => {
            p?.initialise(this.loggerName)?.catch((err) => this.out('warn', err));
        });
    }

    /**
     * calls the `log` function with a `LogLevel` of `trace`
     * @param message the message to be logged
     */
    async trace(message: string, ...data: Array<any>): Promise<void> {
        await this.out('trace', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `debug`
     * @param message the message to be logged
     */
    async debug(message: string, ...data: Array<any>): Promise<void> {
        await this.out('debug', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `info`
     * @param message the message to be logged
     */
    async info(message: string, ...data: Array<any>): Promise<void> {
        await this.out('info', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `step`
     * @param message the message to be logged
     */
    async step(message: string, ...data: Array<any>): Promise<void> {
        this._stepCount += 1;
        await this.out('step', `${this._stepCount}: ${message}`, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `warn`
     * @param message the message to be logged
     */
    async warn(message: string, ...data: Array<any>): Promise<void> {
        await this.out('warn', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `pass`
     * @param message the message to be logged
     */
    async pass(message: string, ...data: Array<any>): Promise<void> {
        await this.out('pass', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `fail`
     * @param message the message to be logged
     */
    async fail(message: string, ...data: Array<any>): Promise<void> {
        await this.out('fail', message, ...data);
    }

    /**
     * calls the `log` function with a `LogLevel` of `error`
     * @param message the message to be logged
     */
    async error(message: string, ...data: Array<any>): Promise<void> {
        await this.out('error', message, ...data);
    }

    /**
     * function will log to the console and then send the `LogLevel`,
     * `message` and `data` on to any loaded `ReportingPlugin` objects
     * @param level the `LogLevel` of this message
     * @param message the string to be logged
     * @param data an array of additional data to be included in the logs
     */
    async out(level: LogLevel, message: string, ...data: any[]): Promise<void> {
        this.log({
            level, 
            message, 
            args: data
        });
        this.plugins.forEach(async (plugin) => {
            await Err.handleAsync(() => plugin?.log(this.loggerName, level, message, ...data), {
                errLevel: 'warn',
                logger: this
            });
        });
    }

    /**
     * function will send the passed in `TestResult` to any loaded `IResultsPlugin` implementations
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async submitResult(result: TestResult): Promise<void> {
        this.plugins.forEach(async (plugin) => {
            await Err.handleAsync(() => plugin?.submitResult(this.loggerName, cloneDeep(result)), {
                errLevel: 'warn',
                logger: this
            });
        });
    }

    /**
     * loops through any loaded `ReportingPlugin` objects and calls
     * their `finalise` function. This should be called upon completion
     * of any logging actions before destroying the `AftLogger` instance
     */
    async finalise(): Promise<void> {
        const name = this.loggerName;
        this.plugins.forEach(async (plugin) => {
            await Err.handleAsync(() => plugin?.finalise(name), {
                errLevel: 'warn',
                logger: this
            });
        });
    }
}
