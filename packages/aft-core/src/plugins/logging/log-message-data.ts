import { LogLevel } from "./log-level";

export type LogMessageData = {
    name?: string;
    logLevel?: LogLevel;
    message?: string;
};