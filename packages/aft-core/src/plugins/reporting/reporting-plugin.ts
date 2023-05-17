import { Plugin, PluginConfig } from "../plugin";
import { LogLevel } from "../../logging/log-level";
import { TestResult } from "./test-result";

export class ReportingPluginConfig extends PluginConfig {
    logLevel: LogLevel;
}

export class ReportingPlugin extends Plugin {
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
        return this.aftLogger.logLevel;
    }
    /**
     * called by the parent `Reporter` on load to allow any plugins to configure
     * themselves for a new logger
     * @param logName the name of the `Reporter` instance calling dispose
     */
    initialise = (logName: string): Promise<void> => null;
    /**
     * used for reporting message strings. this function would be called often
     * @param message the `LogMessageData` to be logged by this plugin
     */
    log = (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => null;
    /**
     * function will report on the passed in `TestResult`
     * @param result a `TestResult` object to be sent
     */
    submitResult = (name: string, result: TestResult): Promise<void> => null;
    /**
     * called by the parent `Reporter` before terminating to allow each plugin to 
     * finalise any deferred logging actions
     * @param name the name of the `Reporter` instance calling finalise
     */
    finalise = (name: string): Promise<void> => null;
}