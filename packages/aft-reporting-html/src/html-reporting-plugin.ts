import * as process from 'node:process';
import * as path from "node:path";
import { AftReporterPlugin, LogLevel, TestResult, fileio, ExpiringFileLock, FileSystemMap, convert, AftConfig, AftReporterPluginConfig, Err } from "aft-core";
import { HtmlTestResult } from "./html-test-result";
import { HtmlResult } from "./html-result";
import { htmlTemplate } from "./templates/html-template";

const defaultFileName = 'testresults.html'

export class HtmlReportingPluginConfig extends AftReporterPluginConfig {
    fileName = defaultFileName;
    outputDir: string = path.join(process.cwd(), 'logs');
    maxLogLines: number = 5;
    override logLevel: LogLevel = 'warn';
}

export class HtmlReportingPlugin extends AftReporterPlugin {
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
        const cfg = this.aftCfg.getSection(HtmlReportingPluginConfig);
        this._level = cfg.logLevel ?? this.aftCfg.logLevel ?? 'warn';
        if (this.enabled) {
            this._results = new FileSystemMap<string, Array<HtmlTestResult>>('htmlSharedResults');
            this._logs = new FileSystemMap<string, Array<string>>('htmlSharedLogs');
            this._fileName = cfg.fileName ?? defaultFileName;
            const dir = cfg.outputDir ?? path.join(process.cwd(), 'logs');
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
        const filePath: string = this._outputDir;
        const fileName: string = this._fileName;
        if (filePath && fileName) {
            fullPathAndFile = path.join(filePath, fileName);
        } else {
            fullPathAndFile = path.join(process.cwd(), defaultFileName);
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

    override initialise = async (logName: string): Promise<void> => { // eslint-disable-line no-unused-vars
        /* do nothing */
    }

    override log = async (name: string, level: LogLevel, message: string, ...data: any[]): Promise<void> => {
        if (!this.enabled) {
            return;
        }
        const expectedLevel: LogLevel = this.logLevel;
        if (LogLevel.toValue(level) >= LogLevel.toValue(expectedLevel) && level !== 'none') {
            const logs = this.logs(name);
            if (data?.length > 0) {
                const dataStr = (data?.length) ? `, [${data?.map(d => {
                    const dHandled = Err.handle(() => JSON.stringify(d));
                    return dHandled.result ?? dHandled.message;
                }).join(',')}]` : '';
                message = `${message}${dataStr}`;
            }
            logs.push(`${level} - ${message}`);
            const max: number = this._maxLogLines;
            while (logs.length > max) {
                logs.shift();
                logs[0] = `...<br />${logs[0]}`;
            }
            this.logs(name, logs);
        }
    }

    override submitResult = async (name: string, result: TestResult): Promise<void> => {
        if (!this.enabled) {
            return;
        }
        const htmlTestResult: HtmlTestResult = {
            ...result,
            logs: this.logs(name ?? result.testName)
        }
        const results: Array<HtmlTestResult> = this.testResults(name ?? result.testName);
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
