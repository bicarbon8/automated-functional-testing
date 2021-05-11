import * as path from "path";
import * as fs from "fs";
import { htmlTemplate } from "./templates/html-template";
import { rand, wait } from "aft-core";

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
    private _id: string;
    private _cacheFile: string;
    private _lockFile: string;

    constructor() {
        this._id = rand.guid;
        this._cacheFile = path.join(process.cwd(), '.htmlCache');
        this._lockFile = path.join(process.cwd(), '.htmlLock');
    }

    async addResult(result: HtmlResult, outputPath: string): Promise<void> {
        await this._updateCache(result);
        let allResults: HtmlResult[] = await this._getResultsFromCache();
        await this._writeResults(outputPath, allResults);
    }

    private async _writeResults(fullPathAndFile: string, allResults: HtmlResult[]): Promise<void> {
        let fileContents: string = htmlTemplate.emit(...allResults);
        fs.writeFileSync(fullPathAndFile, fileContents);
    }

    private _isLocked(): boolean {
        if (fs.existsSync(this._lockFile)) {
            let id: string = fs.readFileSync(this._lockFile, 'utf-8');
            if (id != this._id) {
                return true;
            }
        }
        return false;
    }

    private async _createLock(): Promise<void> {
        await wait.untilTrue(() => {
            return !this._isLocked();
        }, 60000);
        fs.writeFileSync(this._lockFile, this._id, 'utf-8');
    }

    private async _removeLock(): Promise<void> {
        if (fs.existsSync(this._lockFile)) {
            let id: string = fs.readFileSync(this._lockFile, 'utf-8');
            if (id == this._id) {
                fs.unlinkSync(this._lockFile);
            }
        }
    }

    private async _getResultsFromCache(): Promise<HtmlResult[]> {
        if (!fs.existsSync(this._cacheFile)) {
            return [];
        }
        let cache: HtmlResult[];
        try {
            cache = JSON.parse(fs.readFileSync(this._cacheFile, 'utf-8')) as HtmlResult[];
        } catch (e) {
            cache = [];
        }
        return cache;
    }

    private async _updateCache(...results: HtmlResult[]): Promise<void> {
        if (results?.length) {
            try {
                await this._createLock();
                let cache: HtmlResult[] = await this._getResultsFromCache();
                for (var i=0; i<cache.length; i++) {
                    let cacheResult: HtmlResult = cache[i];
                    let updated: boolean = false;
                    for (var j=0; j<results.length; j++) {
                        let result: HtmlResult = results[j];
                        if (result.description == cacheResult.description) {
                            result.tests = Array.from(new Set([...result.tests, ...cacheResult.tests]));
                            updated = true;
                        }
                    }
                    if (!updated) {
                        results.push(cacheResult);
                    }
                }
                fs.writeFileSync(this._cacheFile, JSON.stringify(results));
            } finally {
                await this._removeLock();
            }
        }
    }
}

export const htmlFileMgr = new HtmlFileManager();