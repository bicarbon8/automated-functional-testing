import { LogLevel } from "./log-level";

export type LogMessageData = {
    name?: string;
    level: LogLevel;
    message: string;
    data?: Array<any>;
};
