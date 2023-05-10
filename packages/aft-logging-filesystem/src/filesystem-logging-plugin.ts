import * as path from "path";
import { AftConfig, ConfigManager, configMgr, convert, fileio, ILoggingPlugin, LogLevel, LogMessageData, TestResult } from "aft-core";
import * as date from "date-and-time";

export class FilesystemLoggingPluginConfig {
    logLevel: LogLevel = 'trace';
    outputPath: string = 'logs';
    includeResults: boolean = true;
    dateFormat: string = 'YYYY-MM-DD HH:mm:ss.SSS';
};

export class FilesystemLoggingPlugin implements ILoggingPlugin {
    public readonly aftCfg: ConfigManager;
    public readonly logLevel: LogLevel;
    public readonly enabled: boolean;
    public readonly implements: "logging";
    public readonly outputPath: string;
    public readonly includeResults: boolean;
    public readonly dateFormat: string;

    constructor(cfgMgr?: ConfigManager) {
        cfgMgr = cfgMgr ?? configMgr;
        const fslpc = cfgMgr.getSection(FilesystemLoggingPluginConfig);
        this.logLevel = fslpc.logLevel ?? cfgMgr.getSection(AftConfig).logLevel
            ?? 'trace';
        this.enabled = this.logLevel != 'none';
        if (this.enabled) {
            if (!path.isAbsolute(fslpc.outputPath)) {
                this.outputPath = path.join(process.cwd(), fslpc.outputPath);
            } else {
                this.outputPath = fslpc.outputPath;
            }
            this.includeResults = fslpc.includeResults ?? true;
            this.dateFormat = fslpc.dateFormat ?? 'YYYY-MM-DD HH:mm:ss.SSS';
        }
    }

    async initialise(logName: string): Promise<void> {
        /* do nothing */
    }
    
    async log(message: LogMessageData): Promise<void> {
        if (this.enabled) {
            this._appendToFile(message);
        }
    }

    async logResult(logName: string, result: TestResult): Promise<void> {
        if (this.enabled && this.includeResults) {
            let level: LogLevel;
            switch(result.status) {
                case 'Failed':
                    level = 'fail';
                    break;
                case 'Passed':
                    level = 'pass';
                    break;
                case 'Blocked':
                case 'Skipped':
                    level = 'warn';
                    break;
                default: 
                    level = 'info';
                    break;
            }
            const data: LogMessageData = {
                name: logName,
                level: level,
                message: JSON.stringify(result)
            };
            this._appendToFile(data);
        }
    }

    async finalise(logName: string): Promise<void> {
        /* do nothing */
    }

    private _appendToFile(data: LogMessageData): void {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.logLevel) && data.level != 'none') {
            const filename = convert.toSafeString(data.name);
            const fullPath = path.join(this.outputPath, `${filename}.log`);
            const lock = fileio.getExpiringFileLock(fullPath, 15, 10);
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
        let d: string = date.format(new Date(), this.dateFormat);
        let out: string = `[${d}] - ${data.level.toUpperCase()} - ${data.message}`;
        return out;
    }
}