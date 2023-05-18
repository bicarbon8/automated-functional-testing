import { TestCaseResult } from "@jest/reporters";
import { AftConfig, Reporter, aftConfig } from "aft-core";

export class AftLog {
    private _rep: Reporter;
    private readonly _aftCfg: AftConfig;
    public readonly test: TestCaseResult;
    
    constructor(scope?: any, aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        if (scope) {
            if (typeof scope === 'string') {
                scope = {testCaseResult: {fullName: scope}};
            } else {
                scope = {testCaseResult: {fullName: scope?.getState?.()?.currentTestName}}
            }
        }
        this.test = scope?.testCaseResult || {};
    }

    get fullName(): string {
        try {
            return this.test?.fullName;
        } catch (e) {
            return null;
        }
    }

    get aftCfg(): AftConfig {
        return this._aftCfg;
    }

    get reporter(): Reporter {
        if (!this._rep) {
            this._rep = new Reporter(this.fullName)
        }
        return this._rep;
    }
}