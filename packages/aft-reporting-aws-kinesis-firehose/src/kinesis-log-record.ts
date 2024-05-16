import { TestResult, LogMessageData, MachineInfoData } from "aft-core";

/**
 * **NOTE:**
 * > a `@timestamp` field must also be included, but this is specified via
 * configuration as `KinesisReportingPluginConfig.timestampFieldName`
 */
export type KinesisLogRecord = {
    /**
     * a version string in the format of `'12.1.2'`
     */
    version: string;
    machineInfo: MachineInfoData;
    log?: LogMessageData;
    result?: TestResult;
};
