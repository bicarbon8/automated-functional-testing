import * as path from "path";
import { convert, fileio, LoggingPlugin, LoggingPluginOptions, LogLevel, LogMessageData, Merge, TestException, TestResult } from "aft-core";
import * as date from "date-and-time";

export type FilesystemLoggingPluginOptions = Merge<LoggingPluginOptions, {
    outputPath?: string;
    includeResults?: boolean;
    dateFormat?: string;
}>;

export class FilesystemLoggingPlugin extends LoggingPlugin<FilesystemLoggingPluginOptions> {
    private _outputPath: string;
    private _includeResults: boolean;
    private _dateFormat: string;

    get outputPath(): string {
        if (!this._outputPath) {
            let dir: string = this.option('outputPath', path.join('.', 'logs'));
            if (!path.isAbsolute(dir)) {
                dir = path.join(process.cwd(), dir);
            }
            this._outputPath = dir;
        }
        return this._outputPath;
    }

    get includeResults(): boolean {
        if (this._includeResults == null) {
            this._includeResults = this.option('includeResults', true);
        }
        return this._includeResults;
    }

    get dateFormat(): string {
        if (!this._dateFormat) {
            this._dateFormat = this.option('dateFormat', 'YYYY-MM-DD HH:mm:ss.SSS');
        }
        return this._dateFormat;
    }
    
    async log(message: LogMessageData): Promise<void> {
        this._appendToFile(message);
    }

    async logResult(logName: string, result: TestResult): Promise<void> {
        if (this.includeResults) {
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

    async dispose(logName: string, err?: Error): Promise<void> {
        if (err) {
            const data: LogMessageData = {
                name: logName,
                level: 'error',
                message: TestException.full(err)
            };
            this._appendToFile(data);
        }
    }

    private _appendToFile(data: LogMessageData): void {
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(this.level) && data.level != 'none') {
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