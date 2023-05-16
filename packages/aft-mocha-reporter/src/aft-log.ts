import { AftConfig, LogManager, aftConfig } from "aft-core";

export class AftLog {
    private _logMgr: LogManager;
    
    public readonly test: Mocha.Test;
    public readonly aftCfg: AftConfig;
    
    constructor(scope?: any, aftCfg?: AftConfig) {
        this.test = scope?.test || {};
        this.aftCfg = aftCfg ?? aftConfig;
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
            this._logMgr = new LogManager(this.fullTitle, this.aftCfg);
        }
        return this._logMgr;
    }

    async dispose(): Promise<void> {
        await this.logMgr.dispose();
    }
}