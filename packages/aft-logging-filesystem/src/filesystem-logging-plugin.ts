import * as path from "path";
import { AftConfig, convert, Err, fileio, LoggingPlugin, LogLevel, LogManagerConfig, LogMessageData, ResultsPlugin, TestResult } from "aft-core";
import * as date from "date-and-time";

export class FilesystemLoggingPluginConfig {
    logLevel: LogLevel = 'trace';
    outputPath: string = 'logs';
    includeResults: boolean = true;
    dateFormat: string = 'YYYY-MM-DD HH:mm:ss.SSS';
};

export class FilesystemLoggingPlugin extends LoggingPlugin implements ResultsPlugin {
    public override readonly logLevel: LogLevel;
    public override readonly enabled: boolean;

    private readonly _outputPath: string;
    private readonly _includeResults: boolean;
    private readonly _dateFormat: string;

    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const fslpc = aftCfg.getSection(FilesystemLoggingPluginConfig);
        this.logLevel = fslpc.logLevel ?? aftCfg.getSection(LogManagerConfig).logLevel
            ?? 'trace';
        this.enabled = this.logLevel != 'none';
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

    override initialise = async (logName: string): Promise<void> => {
        /* do nothing */
    }
    
    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        if (this.enabled) {
            if (data?.length > 0) {
                message = `${message} ${data?.map(d => Err.handle(() => d?.toString())).join(', ')}`;
            }
            this._appendToFile({name, level, message});
        }
    }

    submitResult = async (result: TestResult): Promise<void> => {
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
                level: level,
                message: JSON.stringify(result)
            };
            this._appendToFile(data);
        }
    }

    override finalise = async (logName: string): Promise<void> => {
        /* do nothing */
    }

    private _appendToFile(data: LogMessageData): void {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.logLevel) && data.level != 'none') {
            const filename = convert.toSafeString(data.name);
            const fullPath = path.join(this._outputPath, `${filename}.log`);
            const lock = fileio.getExpiringFileLock(fullPath, this.aftCfg);
            try {
                fileio.append(fullPath, `${this._format(data)}\n`);
            } finally {
                lock.unlock();
            }
        }
    }

    private _format(data: LogMessageData): string {
        data = data || {};
        if (!data.message) { data.message = ''; }
        if (!data.level) { data.level = 'none' }
        let d: string = date.format(new Date(), this._dateFormat);
        let out: string = `[${d}] - ${data.level.toUpperCase()} - ${data.message}`;
        return out;
    }
}