import { LogLevel } from "./log-level";

export interface FormatOptions {
    name?: string;
    level?: LogLevel;
    message?: string;
}