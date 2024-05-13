import { TestResult, LogMessageData, MachineInfoData } from "aft-core";

export type KinesisLogRecord = {
    created: number;
    version: string;
    machineInfo: MachineInfoData;
    log?: LogMessageData;
    result?: TestResult;
};
