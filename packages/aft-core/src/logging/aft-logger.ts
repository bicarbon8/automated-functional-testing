import * as colors from "colors";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { LogLevel } from "./log-level";
import { ellide } from "../helpers/ellide";
import { LogMessageData } from "./log-message-data";

/**
 * a logging class that uses configuration to determine what
 * should be logged to the console and formats the logging output
 * to indicate the source of the logging data.
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
 * 
 * **NOTE**: this should only be used in cases where using `Reporter` would
 * not be reasonable such as inside core components of AFT; otherwise you
 * should use a `Reporter` instance instead
 */
export class AftLogger {
    public readonly aftCfg: AftConfig;
    
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
    get logLevel(): LogLevel {
        return this.aftCfg.logLevel ?? 'warn';
    }

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }

    /**
     * function will check that the `level` is greater or equal to the current configured `logLevel`
     * and if it is, will send the `name`, `level` and `message` to the console. if any `data`
     * is included it will be converted to a string using `JSON.stringify(...)` and appended
     * to the `message`
     * @param name the name of the system performing the log call
     * @param level the `LogLevel` of this message
     * @param message the string to be logged
     * @param data an array of additional data to be included in the logs
     */
    log(data: LogMessageData): void {
        if (data?.level !== 'none'
            && LogLevel.toValue(data?.level) >= LogLevel.toValue(this.logLevel)
            && data?.message) {
                const out: string = this.format(data);
                this.toConsole(data.level, out);
        }
    }

    /**
     * formats the passed in `LogMessage.message` based on the passed in options
     * @param data a `LogMessage` object containing the `level`, `name` and `message` to
     * be formatted into a console-friendly log string
     * @returns the formatted log string
     */
    format(data: LogMessageData) {
        data ??= {} as LogMessageData;
        data.name ??= 'AFT';
        data.message ??= '';
        data.level ??= 'none';
        const d: string = new Date().toLocaleTimeString();
        const out = `${d} - [${data.name}] - ${ellide(data.level.toUpperCase(), 5, 'end', '')} - ${data.message}`;
        return out;
    }

    /**
     * applies a colour based on the supplied `level` and outputs the `message`
     * to the console using `console.log` in that colour
     * > NOTE: calling this function directly will bypass checking the `level`
     * to see if the `message` should actually be logged and simply outputs to
     * the console
     * @param level a valid {LogLevel} like 'warn' or 'trace'
     * @param message the message string to log to console
     */
    toConsole(level: LogLevel, message: string): void {
        switch (level) {
            case 'error':
            case 'fail':
                console.log(colors.red(message));
                break;
            case 'warn':
                console.log(colors.yellow(message));
                break;
            case 'info':
                console.log(colors.white(message));
                break;
            case 'pass':
                console.log(colors.green(message));
                break;
            case 'step':
                console.log(colors.magenta(message));
                break;
            case 'trace':
            case 'debug':
                console.log(colors.blue(message));
                break;
            default:
                console.log(colors.gray(message));
                break;
        }
    }
}

/**
 * a global instance of the `AftLogger` for use in AFT core components or systems
 * that should not log to any plugins
 */
export const aftLogger = new AftLogger();
