import { ReportingPlugin, AftConfig, TestResult, LogMessageData } from "../../../src";

export class ThrowsReportingPlugin extends ReportingPlugin {
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
    }
    override initialise = async (logName: string): Promise<void> => {
        throw 'initialise exception';
    }
    override log = async (logData: LogMessageData): Promise<void> => {
        throw 'log exception';
    }
    override submitResult = async (result: TestResult): Promise<void> => {
        throw 'submitResult exception';
    }
    override finalise = async (name: string, error?: Error): Promise<void> => {
        throw 'dispose exception';
    }
}