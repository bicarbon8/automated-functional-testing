import * as path from "path";
import { LoggingPlugin, LogLevel, TestResult, fileio, ExpiringFileLock, FileSystemMap, convert, AftConfig, ResultsPlugin, LoggingPluginConfig } from "aft-core";
import { HtmlTestResult } from "./html-test-result";
import { HtmlResult } from "./html-result";
import { htmlTemplate } from "./templates/html-template";

export class HtmlLoggingPluginConfig extends LoggingPluginConfig {
    fileName: string;
    outputDir: string;
    maxLogLines: number;
    override logLevel: LogLevel = 'warn';
}

export class HtmlLoggingPlugin extends LoggingPlugin implements ResultsPlugin {
    public override get logLevel(): LogLevel {
        return this._level;
    }

    private readonly _results: FileSystemMap<string, Array<HtmlTestResult>>;
    private readonly _logs: FileSystemMap<string, Array<string>>;
    private readonly _fileName: string;
    private readonly _outputDir: string;
    private readonly _maxLogLines: number;
    private readonly _level: LogLevel;
    
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(HtmlLoggingPluginConfig);
        this._level = cfg.logLevel ?? this.aftCfg.logLevel ?? 'warn';
        if (this.enabled) {
            this._results = new FileSystemMap<string, Array<HtmlTestResult>>('htmlSharedResults');
            this._logs = new FileSystemMap<string, Array<string>>('htmlSharedLogs');
            this._fileName = cfg.fileName ?? 'testresults.html';
            let dir = cfg.outputDir ?? process.cwd();
            if (path.isAbsolute(dir)) {
                this._outputDir = dir;
            } else {
                this._outputDir = path.join(process.cwd(), dir);
            }
            this._maxLogLines = cfg.maxLogLines ?? 5;
        }
    }

    get fullPathAndFile(): string {
        if (!this.enabled) {
            return null;
        }
        let fullPathAndFile: string;
        let filePath: string = this._outputDir;
        let fileName: string = this._fileName;
        if (filePath && fileName) {
            fullPathAndFile = path.join(filePath, fileName);
        } else {
            fullPathAndFile = path.join(process.cwd(), 'testresults.html');
        }
        return fullPathAndFile;
    }

    logs(key: string, val?: Array<string>): Array<string> {
        if (!this.enabled) {
            return null;
        }
        if (!this._logs.has(key)) {
            this._logs.set(key, new Array<string>());
        }
        if (val) {
            this._logs.set(key, val);
        }
        return this._logs.get(key);
    }

    testResults(key: string, val?: Array<HtmlTestResult>): Array<HtmlTestResult> {
        if (!this.enabled) {
            return null;
        }
        if (!this._results.has(key)) {
            this._results.set(key, new Array<HtmlTestResult>());
        }
        if (val) {
            this._results.set(key, val);
        }
        return this._results.get(key);
    }

    override initialise = async (logName: string): Promise<void> => {
        /* do nothing */
    }

    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        if (!this.enabled) {
            return;
        }
        let expectedLevel: LogLevel = this.logLevel;
        if (LogLevel.toValue(level) >= LogLevel.toValue(expectedLevel) && level != 'none') {
            const logs = this.logs(name);
            logs.push(`${level} - ${message}`);
            let max: number = this._maxLogLines;
            while (logs.length > max) {
                logs.shift();
                logs[0] = `...<br />${logs[0]}`;
            }
            this.logs(name, logs);
        }
    }

    submitResult = async (result: TestResult): Promise<void> => {
        if (!this.enabled || !result.testName) {
            return;
        }
        let htmlTestResult: HtmlTestResult = {
            testId: result.testId,
            status: result.status,
            logs: this.logs(result.testName)
        }
        const results: Array<HtmlTestResult> = this.testResults(result.testName);
        results.push(htmlTestResult);
        this.testResults(result.testName, results);
    }

    override finalise = async (logName: string): Promise<void> => {
        if (!this.enabled) {
            return;
        }
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
        const lock: ExpiringFileLock = new ExpiringFileLock(fullPathAndFile, this.aftCfg);
        try {
            fileio.write(fullPathAndFile, htmlTemplate.emit(...results));
        } finally {
            lock.unlock();
        }
    }
}