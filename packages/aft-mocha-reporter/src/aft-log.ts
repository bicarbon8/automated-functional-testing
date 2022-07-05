import { FileSystemMap, LogManager } from "aft-core";

export class AftLog {
    private _logMgr: LogManager;
    
    public readonly test: Mocha.Test;
    
    constructor(scope?: any) {
        this.test = scope?.test || {};
    }

    get fullTitle(): string {
        try {
            return this.test?.fullTitle();
        } catch (e) {
            return null;
        }
    }

    get logMgr(): LogManager {
        if (!this._logMgr) {
            this._logMgr = new LogManager({logName: this.fullTitle})
        }
        return this._logMgr;
    }

    async dispose(): Promise<void> {
        await this.logMgr.dispose();
    }
}