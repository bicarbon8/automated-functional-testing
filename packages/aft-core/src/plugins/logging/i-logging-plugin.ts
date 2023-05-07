import { IPlugin } from "../i-plugin";
import { TestResult } from "../test-cases/test-result";
import { LogLevel } from "./log-level";
import { LogMessageData } from "./log-message-data";

export interface ILoggingPlugin extends IPlugin {
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
    readonly level: LogLevel;
    /**
     * called by the parent `AftLog` on load to allow any plugins to configure
     * themselves for a new logger
     * @param logName the name of the `AftLog` instance calling dispose
     */
    initialise(logName: string): Promise<void>;
    /**
     * used for logging of message strings. this function would be called often
     * @param message the `LogMessageData` to be logged by this plugin
     */
    log(message: LogMessageData): Promise<void>;
    /**
     * used for logging test results. this function would only be called at the end
     * of a given test
     * @param logName the name of the `AftLog` instance sending this result
     * @param result a `TestResult` indicating success or failure of a given test
     */
    logResult(logName: string, result: TestResult): Promise<void>;
    /**
     * called by the parent `AftLog` before terminating to allow each plugin to 
     * finalise any deferred logging actions
     * @param logName the name of the `AftLog` instance calling finalise
     */
    finalise(logName: string): Promise<void>;
}