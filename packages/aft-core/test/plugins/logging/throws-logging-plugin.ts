import { LoggingPlugin, LogLevel, AftConfig } from "../../../src";

export class ThrowsLoggingPlugin extends LoggingPlugin {
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
    }
    override initialise = async (logName: string): Promise<void> => {
        throw 'initialise exception';
    }
    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        throw 'log exception';
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        throw 'dispose exception';
    }
}