import * as process from 'node:process';
import * as path from "node:path";
import { AftConfig, convert, ExpiringFileLock, fileio, ReportingPlugin, ReportingPluginConfig, LogLevel, LogMessageData, TestResult, ellide, EllipsisLocation } from "aft-core";
import * as date from "date-and-time";

export class FilesystemReportingPluginConfig extends ReportingPluginConfig {
    override logLevel: LogLevel = 'trace';
    outputPath: string = path.join(process.cwd(), 'logs');
    includeResults = true;
    dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
    maxFilenameLength = 222;
    ellipsisLocation: EllipsisLocation = 'middle';
}

export class FilesystemReportingPlugin extends ReportingPlugin {
    public override get logLevel(): LogLevel {
        return this._level;
    }

    private readonly _outputPath: string;
    private readonly _includeResults: boolean;
    private readonly _dateFormat: string;
    private readonly _level: LogLevel;
    private readonly _maxFilenameLength: number;
    private readonly _ellipsisLocation: EllipsisLocation;

    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const fslpc = this.aftCfg.getSection(FilesystemReportingPluginConfig);
        this._level = fslpc.logLevel ?? this.aftCfg.logLevel ?? 'trace';
        if (!path.isAbsolute(fslpc.outputPath)) {
            this._outputPath = path.join(process.cwd(), fslpc.outputPath);
        } else {
            this._outputPath = fslpc.outputPath;
        }
        this._includeResults = fslpc.includeResults ?? true;
        this._dateFormat = fslpc.dateFormat ?? 'YYYY-MM-DD HH:mm:ss.SSS';
        this._maxFilenameLength = fslpc.maxFilenameLength ?? 222;
        this._ellipsisLocation = fslpc.ellipsisLocation ?? 'middle';
    }

    override initialise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }
    
    override log = async (logObj: LogMessageData): Promise<void> => {
        if (this.enabled) {
            this._appendToFile(logObj);
        }
    }

    override submitResult = async (result: TestResult): Promise<void> => {
        if (this.enabled && this._includeResults) {
            let level: LogLevel;
            switch(result.status) {
                case 'failed':
                    level = 'fail';
                    break;
                case 'passed':
                    level = 'pass';
                    break;
                case 'blocked':
                case 'skipped':
                    level = 'warn';
                    break;
                default: 
                    level = 'info';
                    break;
            }
            const data: LogMessageData = {
                name: result.testName,
                level,
                message: JSON.stringify(result)
            };
            this._appendToFile(data);
        }
    }

    override finalise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }

    private _appendToFile(logObj: LogMessageData): void {
        if (LogLevel.toValue(logObj.level) >= LogLevel.toValue(this.logLevel) && logObj.level !== 'none') {
            const filename = convert.toSafeString(logObj.name);
            const filenameShortened = ellide(filename, this._maxFilenameLength, this._ellipsisLocation);
            const fullPath = path.join(this._outputPath, `${filenameShortened}.log`);
            const lock = new ExpiringFileLock(fullPath, this.aftCfg);
            try {
                fileio.append(fullPath, `${this._format(logObj)}\n`);
            } finally {
                lock.unlock();
            }
        }
    }

    private _format(logObj: LogMessageData): string {
        logObj ??= {} as LogMessageData;
        logObj.message ??= '';
        logObj.level ??= 'none';
        const dataStrings = logObj.data?.map(d => {
            try {
                return JSON.stringify(d);
            } catch {
                return d?.toString();
            }
        }) ?? [];
        const args: string = (logObj.data?.length) ? ` ${dataStrings.join(' ')}` : '';
        const d: string = date.format(new Date(), this._dateFormat);
        const out = `[${d}] - ${ellide(logObj.level.toUpperCase(), 5, 'end', '')} - ${logObj.message}${args}`;
        return out;
    }
}
