import { ITestResult, LogLevel } from "../../../src";
import { LogMessage } from "./log-message";

export interface LoggingPluginStore {
    logs?: LogMessage[];
    results?: ITestResult[];
    lvl?: LogLevel;
    en?: boolean;
    disposed?: boolean;
    onLoad?: boolean;
}