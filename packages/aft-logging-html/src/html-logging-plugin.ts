import * as path from "path";
import { LoggingPlugin, LogLevel, TestResult, fileio, ExpiringFileLock, FileSystemMap, LogMessageData, Merge, LoggingPluginOptions } from "aft-core";
import { HtmlTestResult } from "./html-test-result";
import { HtmlResult } from "./html-result";
import { htmlTemplate } from "./templates/html-template";

export type HtmlLoggingPluginOptions = Merge<LoggingPluginOptions, {
    fileName?: string;
    outputDir?: string;
    maxLogLines?: number;
}>;

export class HtmlLoggingPlugin extends LoggingPlugin<HtmlLoggingPluginOptions> {
    private readonly _logs: string[];
    private readonly _testResults: HtmlTestResult[];
    private readonly _fsMap: FileSystemMap<string, HtmlResult>;
    
    constructor(options?: HtmlLoggingPluginOptions) {
        super(options);
        this._logs = [];
        this._testResults = [];
        this._fsMap = new FileSystemMap<string, HtmlResult>('htmlSharedResults');
    }

    get fileName(): string {
        return this.option('fileName', 'testresults.html');
    }

    get outputDir(): string {
        let dir: string = this.option('outputDir', process.cwd());
        if (!path.isAbsolute(dir)) {
            dir = path.join(process.cwd(), dir);
        }
        return dir;
    }

    get fullPathAndFile(): string {
        let fullPathAndFile: string;
        let filePath: string = this.outputDir;
        let fileName: string = this.fileName;
        if (filePath && fileName) {
            fullPathAndFile = path.join(filePath, fileName);
        } else {
            fullPathAndFile = path.join(process.cwd(), 'testresults.html');
        }
        return fullPathAndFile;
    }

    get maxLogLines(): number {
        return this.option('maxLogLines', 5);
    }

    override async log(data: LogMessageData): Promise<void> {
        let expectedLevel: LogLevel = this.level;
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(expectedLevel) && data.level != 'none') {
            this._logs.push(`${data.level} - ${data.message}`);
            let max: number = this.maxLogLines;
            while (this._logs.length > max) {
                this._logs.shift();
                this._logs[0] = `...<br />${this._logs[0]}`;
            }
        }
    }

    override async logResult(logName: string, result: TestResult): Promise<void> {
        let htmlTestResult: HtmlTestResult = {
            testId: result.testId,
            status: result.status,
            logs: this.logs
        }
        this._testResults.push(htmlTestResult);
    }

    get logs(): string[] {
        return this._logs;
    }

    override async dispose(logName: string, error?: Error): Promise<void> {
        const result: HtmlResult = {
            description: logName,
            tests: this._testResults
        };
        this._updateSharedCache(result);
        const results: HtmlResult[] = this._readFromSharedCache();
        await this._regenerateHtmlFile(results);
    }

    private async _regenerateHtmlFile(results: HtmlResult[]): Promise<void> {
        const fullPathAndFile = this.fullPathAndFile;
        const lock: ExpiringFileLock = fileio.getExpiringFileLock(fullPathAndFile, 30000, 10000);
        try {
            fileio.write(fullPathAndFile, htmlTemplate.emit(...results));
        } finally {
            lock.unlock();
        }
    }

    private _updateSharedCache(result: HtmlResult): void {
        this._fsMap.set(result.description, result);
    }

    private _readFromSharedCache(): HtmlResult[] {
        return Array.from(this._fsMap.values());
    }
}