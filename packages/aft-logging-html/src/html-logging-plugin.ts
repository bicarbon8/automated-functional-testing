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
    private readonly _logs: Map<string, Array<string>>;
    private readonly _testResults: Map<string, Array<HtmlTestResult>>;
    private readonly _fsMap: FileSystemMap<string, HtmlResult>;
    
    constructor(options?: HtmlLoggingPluginOptions) {
        super(options);
        this._logs = new Map<string, Array<string>>();
        this._testResults = new Map<string, Array<HtmlTestResult>>();
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

    logs(key: string, val?: Array<string>): Array<string> {
        if (!this._logs.has(key)) {
            this._logs.set(key, new Array<string>());
        }
        if (val) {
            this._logs.set(key, val);
        }
        return this._logs.get(key);
    }

    testResults(key: string, val?: Array<HtmlTestResult>): Array<HtmlTestResult> {
        if (!this._testResults.has(key)) {
            this._testResults.set(key, new Array<HtmlTestResult>());
        }
        if (val) {
            this._testResults.set(key, val);
        }
        return this._testResults.get(key);
    }

    override async log(data: LogMessageData): Promise<void> {
        let expectedLevel: LogLevel = this.level;
        if (LogLevel.toValue(data.level) >= LogLevel.toValue(expectedLevel) && data.level != 'none') {
            const logs = this.logs(data.name);
            logs.push(`${data.level} - ${data.message}`);
            let max: number = this.maxLogLines;
            while (logs.length > max) {
                logs.shift();
                logs[0] = `...<br />${logs[0]}`;
            }
            this.logs(data.name, logs);
        }
    }

    override async logResult(logName: string, result: TestResult): Promise<void> {
        let htmlTestResult: HtmlTestResult = {
            testId: result.testId,
            status: result.status,
            logs: this.logs(logName)
        }
        const testResults = this.testResults(logName);
        testResults.push(htmlTestResult);
        this.testResults(logName, testResults);
    }

    override async dispose(logName: string, error?: Error): Promise<void> {
        const result: HtmlResult = {
            description: logName,
            tests: this.testResults(logName)
        };
        this._updateSharedCache(result);
        const results: HtmlResult[] = this._readFromSharedCache();
        await this._regenerateHtmlFile(results);
        this._logs.delete(logName);
        this._testResults.delete(logName);
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