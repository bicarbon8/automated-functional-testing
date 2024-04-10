import { ReportingPlugin } from "./reporting-plugin";
import { LogLevel } from "../../logging/log-level";
import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { pluginLoader } from "../plugin-loader";
import { AftLogger } from "../../logging/aft-logger";
import { TestResult } from "./test-result";
import { Err } from "../../helpers/err";
import { cloneDeep } from "lodash";

/**
 * a class that manages reporting plugins and handles test
 * logging and results.
 * Configuration for this class can be passed in directly
 * via `AftConfig` or specified in `aftconfig.json` like:
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
 * const r1 = new ReportingManager('reporter for test 1');
 * const r2 = new ReportingManager('reporter for test 2');
 * ```
 */
export class ReportingManager {
    /**
     * the `AftConfig` instance used by this instance
     */
    readonly aftCfg: AftConfig;
    /**
     * an array of enabled `ReportingPlugin` instances
     */
    readonly plugins: Array<ReportingPlugin>;
    /**
     * the name sent to all `ReportingPlugin` function calls
     * and used to create this instance's `AftLogger`
     */
    readonly name: string;
    /**
     * the console logger used by this `ReportingManager`
     */
    readonly logger: AftLogger;

    private _stepCount = 0;
    private _initialised: boolean;

    constructor(name: string, aftCfg?: AftConfig) {
        this.name = name;
        this.aftCfg = aftCfg ?? aftConfig;
        this.logger = new AftLogger(this.name, this.aftCfg);
        this.plugins = pluginLoader.getEnabledPluginsByType(ReportingPlugin, this.aftCfg);
    }

    /**
     * the `LogLevel` governing output to this instance's console
     * logger. the value can be modified by passing in a custom
     * `AftConfig` instance where the `logLevel` has been set or
     * by simply specifying a `logLevel` in your `aftconfig.json`
     */
    get logLevel(): LogLevel {
        return this.aftCfg.logLevel ?? 'warn';
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
        this._stepCount += 1;
        await this.log('step', `${this._stepCount}: ${message}`, ...data);
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
     * function will log to the console and then send the `LogLevel`,
     * `message` and `data` on to any loaded `ReportingPlugin` objects
     * @param level the `LogLevel` of this message
     * @param message the string to be logged
     * @param data an array of additional data to be included in the logs
     */
    async log(level: LogLevel, message: string, ...data: any[]): Promise<void> {
        if (!this._initialised) {
            for (const p of this.plugins) {
                await Err.handleAsync(() => p?.initialise(this.name), {
                    errLevel: 'warn',
                    logger: this.logger
                });
            }
            this._initialised = true;
        }
        this.logger.log({
            level, 
            message, 
            args: data
        });
        for (const plugin of this.plugins) {
            await Err.handleAsync(() => plugin?.log(this.name, level, message, ...data), {
                errLevel: 'warn',
                logger: this.logger
            });
        }
    }

    /**
     * function will send the passed in `TestResult` to any loaded `IResultsPlugin` implementations
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async submitResult(result: TestResult): Promise<void> {
        for (const plugin of this.plugins) {
            await Err.handleAsync(() => plugin?.submitResult(this.name, cloneDeep(result)), {
                errLevel: 'warn',
                logger: this.logger
            });
        }
    }

    /**
     * loops through any loaded `ReportingPlugin` objects and calls
     * their `finalise` function. This should be called upon completion
     * of any logging actions before destroying the `AftLogger` instance
     */
    async finalise(): Promise<void> {
        for (const plugin of this.plugins) {
            await Err.handleAsync(() => plugin?.finalise(this.name), {
                errLevel: 'warn',
                logger: this.logger
            });
        }
    }
}
