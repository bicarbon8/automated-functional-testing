import { TestResult, MachineInfoData } from "aft-core";

export interface KinesisLogRecord {
    logName?: string;
    message?: string;
    level?: string;
    result?: TestResult;
    version?: string;
    buildName?: string;
    buildNumber?: string;
    machineInfo?: MachineInfoData;
}