import * as fs from "fs";
import { htmlTemplate } from "./templates/html-template";

export interface HtmlResult {
    description: string;
    tests: HtmlTestResult[];
}

export interface HtmlTestResult {
    testId?: string;
    status: string;
    logs: string[];
}

export class HtmlFileManager {
    private _results: HtmlResult[];

    constructor() {
        this._results = [];
    }

    addResult(result: HtmlResult, outputPath: string): void {
        this._results.push(result);
        this._writeResults(outputPath);
    }

    private _writeResults(fullPathAndFile: string): void {
        let fileContents: string = htmlTemplate.emit(...this._results);
        fs.writeFileSync(fullPathAndFile, fileContents);
    }
}

export const htmlFileMgr = new HtmlFileManager();