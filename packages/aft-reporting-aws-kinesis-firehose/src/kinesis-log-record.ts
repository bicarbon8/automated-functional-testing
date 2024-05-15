import { TestResult, LogMessageData, MachineInfoData } from "aft-core";

export type KinesisLogRecord = {
    /**
     * a `Date` string in the format of `'2024-05-15 15:58:59'`
     */
    Created: string;
    /**
     * a version string in the format of `'12.1.2'`
     */
    version: string;
    machineInfo: MachineInfoData;
    log?: LogMessageData;
    result?: TestResult;
};
