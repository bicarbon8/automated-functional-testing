import { nameof } from "ts-simple-nameof";
import * as path from "path";
import { AbstractLoggingPlugin, ILoggingPluginOptions, ITestResult, LoggingLevel, LoggingPluginManager, TestStatus } from "aft-core";
import { HtmlResult, HtmlTestResult, HtmlFileManager, htmlFileMgr } from "./html-file-manager";

export interface HtmlLoggingPluginOptions extends ILoggingPluginOptions {
    fileName?: string;
    outputDir?: string;
    maxLogLines?: number;

    _htmlFileMgr?: HtmlFileManager;
}

export class HtmlLoggingPlugin extends AbstractLoggingPlugin {
    private _htmlFileMgr: HtmlFileManager;
    private _logs: string[];
    private _results: HtmlTestResult[];
    private _fullPathAndFile: string;
    private _fileName: string;
    private _outputDir: string;
    private _maxLogLines: number;
    
    constructor(options?: HtmlLoggingPluginOptions) {
        super(nameof(HtmlLoggingPlugin).toLowerCase(), options);
        this._htmlFileMgr = options?._htmlFileMgr || htmlFileMgr;
        this._logs = [];
        this._results = [];
    }

    async fileName(): Promise<string> {
        if (!this._fileName) {
            this._fileName = await this.optionsMgr?.getOption(nameof<HtmlLoggingPluginOptions>(o => o.fileName), 'testresults.html');
        }
        return this._fileName;
    }

    async outputDir(): Promise<string> {
        if (!this._outputDir) {
            let dir: string = await this.optionsMgr?.getOption(nameof<HtmlLoggingPluginOptions>(o => o.outputDir), process.cwd());
            if (path.isAbsolute(dir)) {
                this._outputDir = dir;
            } else {
                this._outputDir = path.join(process.cwd(), dir);
            }
        }
        return this._outputDir;
    }

    async fullPathAndFile(): Promise<string> {
        if (this._fullPathAndFile === undefined) {
            let filePath: string = await this.outputDir();
            let fileName: string = await this.fileName();
            if (filePath && fileName) {
                this._fullPathAndFile = path.join(filePath, fileName);
            }
        }
        return this._fullPathAndFile;
    }

    async maxLogLines(): Promise<number> {
        if (this._maxLogLines === undefined) {
            this._maxLogLines = await this.optionsMgr.getOption(nameof<HtmlLoggingPluginOptions>(o => o.maxLogLines), 5);
        }
        return this._maxLogLines;
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async log(level: LoggingLevel, message: string): Promise<void> {
        if (await this.enabled()) {
            let expectedLevel: LoggingLevel = await this.level();
            if (level.value >= expectedLevel.value && level.value != LoggingLevel.none.value) {
                this._logs.push(`${level}${message}`);
                let max: number = await this.maxLogLines();
                while (this._logs.length > max) {
                    this._logs.shift();
                    this._logs[0] = `...<br />${this._logs[0]}`;
                }
            }
        }
    }

    async logResult(result: ITestResult): Promise<void> {
        if (await this.enabled()) {
            let htmlTestResult: HtmlTestResult = {
                testId: result.testId,
                status: TestStatus[result.status],
                logs: this.getLogs()
            }
            this._results.push(htmlTestResult);
        }
    }

    getLogs(): string[] {
        return this._logs;
    }

    async getResult(): Promise<HtmlResult> {
        let name: string = await this.logName();
        return {
            description: name,
            tests: this._results
        };
    }

    async dispose(error?: Error): Promise<void> {
        if (await this.enabled()) {
            let result: HtmlResult = await this.getResult();
            let outputPath: string = await this.fullPathAndFile();
            this._htmlFileMgr.addResult(result, outputPath);
        }
    }
}