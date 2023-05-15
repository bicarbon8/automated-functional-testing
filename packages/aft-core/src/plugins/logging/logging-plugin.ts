import { Plugin, PluginConfig } from "../plugin";
import { LogLevel } from "./log-level";

export class LoggingPluginConfig extends PluginConfig {
    logLevel: LogLevel = 'none';
}

export class LoggingPlugin extends Plugin {
    override get enabled(): boolean {
        return this.logLevel != 'none';
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
    get logLevel(): LogLevel {
        return 'none';
    }
    /**
     * called by the parent `AftLog` on load to allow any plugins to configure
     * themselves for a new logger
     * @param logName the name of the `AftLog` instance calling dispose
     */
    initialise = (logName: string): Promise<void> => null;
    /**
     * used for logging of message strings. this function would be called often
     * @param message the `LogMessageData` to be logged by this plugin
     */
    log = (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => null;
    /**
     * called by the parent `AftLog` before terminating to allow each plugin to 
     * finalise any deferred logging actions
     * @param logName the name of the `AftLog` instance calling finalise
     */
    finalise = (logName: string): Promise<void> => null;
}