import { AftConfig, Reporter, aftConfig } from "aft-core";

export class AftLog {
    private _rep: Reporter;
    
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

    get reporter(): Reporter {
        if (!this._rep) {
            this._rep = new Reporter(this.fullTitle, this.aftCfg);
        }
        return this._rep;
    }

    async dispose(): Promise<void> {
        await this.reporter.dispose();
    }
}