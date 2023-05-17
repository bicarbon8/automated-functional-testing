import { ReportingPlugin, LogLevel, AftConfig, TestResult } from "../../../src";

export class ThrowsReportingPlugin extends ReportingPlugin {
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
    }
    override initialise = async (logName: string): Promise<void> => {
        throw 'initialise exception';
    }
    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        throw 'log exception';
    }
    override submitResult = async (name: string, result: TestResult): Promise<void> => {
        throw 'submitResult exception';
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        throw 'dispose exception';
    }
}