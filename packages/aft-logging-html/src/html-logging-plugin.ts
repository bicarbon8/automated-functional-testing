import * as path from "path";
import { LoggingPlugin, LogLevel, TestResult, fileio, ExpiringFileLock, FileSystemMap, LogMessageData, Merge, LoggingPluginOptions, convert } from "aft-core";
import { HtmlTestResult } from "./html-test-result";
import { HtmlResult } from "./html-result";
import { htmlTemplate } from "./templates/html-template";

export type HtmlLoggingPluginOptions = Merge<LoggingPluginOptions, {
    fileName?: string;
    outputDir?: string;
    maxLogLines?: number;
}>;

export class HtmlLoggingPlugin extends LoggingPlugin<HtmlLoggingPluginOptions> {
    private readonly _results: FileSystemMap<string, Array<HtmlTestResult>>;
    private readonly _logs: FileSystemMap<string, Array<string>>;
    
    constructor(options?: HtmlLoggingPluginOptions) {
        super(options);
        this._results = new FileSystemMap<string, Array<HtmlTestResult>>('htmlSharedResults');
        this._logs = new FileSystemMap<string, Array<string>>('htmlSharedLogs')
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
        if (!this._results.has(key)) {
            this._results.set(key, new Array<HtmlTestResult>());
        }
        if (val) {
            this._results.set(key, val);
        }
        return this._results.get(key);
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
        const results: Array<HtmlTestResult> = this.testResults(logName);
        results.push(htmlTestResult);
        this.testResults(logName, results);
    }

    override async dispose(logName: string, error?: Error): Promise<void> {
        const htmlResults: HtmlResult[] = new Array<HtmlResult>();
        this._results.forEach((result: Array<HtmlTestResult>, key: string) => {
            htmlResults.push({
                description: convert.toSafeString(key),
                tests: result
            });
        });
        await this._regenerateHtmlFile(htmlResults);
        this._logs.delete(logName);
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
}