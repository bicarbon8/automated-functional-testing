import * as process from 'node:process';
import * as path from "node:path";
import { AftConfig, convert, Err, ExpiringFileLock, fileio, AftReportingPlugin, AftReportingPluginConfig, LogLevel, LogMessageData, TestResult } from "aft-core";
import * as date from "date-and-time";

export class FilesystemReportingPluginConfig extends AftReportingPluginConfig {
    override logLevel: LogLevel = 'trace';
    outputPath: string = path.join(process.cwd(), 'logs');
    includeResults = true;
    dateFormat = 'YYYY-MM-DD HH:mm:ss.SSS';
}

export class FilesystemReportingPlugin extends AftReportingPlugin {
    public override get logLevel(): LogLevel {
        return this._level;
    }

    private readonly _outputPath: string;
    private readonly _includeResults: boolean;
    private readonly _dateFormat: string;
    private readonly _level: LogLevel;

    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const fslpc = this.aftCfg.getSection(FilesystemReportingPluginConfig);
        this._level = fslpc.logLevel ?? this.aftCfg.logLevel
            ?? 'trace';
        if (this.enabled) {
            if (!path.isAbsolute(fslpc.outputPath)) {
                this._outputPath = path.join(process.cwd(), fslpc.outputPath);
            } else {
                this._outputPath = fslpc.outputPath;
            }
            this._includeResults = fslpc.includeResults ?? true;
            this._dateFormat = fslpc.dateFormat ?? 'YYYY-MM-DD HH:mm:ss.SSS';
        }
    }

    override initialise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }
    
    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        if (this.enabled) {
            if (data?.length > 0) {
                const dataStr = (data?.length) ? `, [${data?.map(d => {
                    const dHandled = Err.handle(() => JSON.stringify(d));
                    return dHandled.result ?? dHandled.message;
                }).join(',')}]` : '';
                message = `${message}${dataStr}`;
            }
            this._appendToFile({name, level, message});
        }
    }

    override submitResult = async (name: string, result: TestResult): Promise<void> => {
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
                name: name ?? result.testName,
                level: level,
                message: JSON.stringify(result)
            };
            this._appendToFile(data);
        }
    }

    override finalise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }

    private _appendToFile(data: LogMessageData): void {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.logLevel) && data.level != 'none') {
            const filename = convert.toSafeString(data.name);
            const fullPath = path.join(this._outputPath, `${filename}.log`);
            const lock = new ExpiringFileLock(fullPath, this.aftCfg);
            try {
                fileio.append(fullPath, `${this._format(data)}\n`);
            } finally {
                lock.unlock();
            }
        }
    }

    private _format(data: LogMessageData): string {
        data = data || {} as LogMessageData;
        data.message ??= '';
        data.level ??= 'none';
        const d: string = date.format(new Date(), this._dateFormat);
        const out = `[${d}] - ${data.level.toUpperCase()} - ${data.message}`;
        return out;
    }
}
