import { ITestResult, LoggingLevel } from "../../../src";
import { LogMessage } from "./log-message";

export interface LoggingPluginStore {
    logs?: LogMessage[];
    results?: ITestResult[];
    lvl?: LoggingLevel;
    en?: boolean;
    disposed?: boolean;
    onLoad?: boolean;
}