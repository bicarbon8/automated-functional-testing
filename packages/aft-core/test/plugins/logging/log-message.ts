import { LogLevel } from "../../../src/plugins/logging/log-level";

export class LogMessage {
    level: LogLevel;
    message: string;
    constructor(level: LogLevel, message: string) {
        this.level = level;
        this.message = message;
    }
}