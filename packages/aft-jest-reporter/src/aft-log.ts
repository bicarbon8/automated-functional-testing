import { TestCaseResult } from "@jest/reporters";
import { AftConfig, Reporter, aftConfig, convert } from "aft-core";

export class AftLog {
    private _rep: Reporter;
    private readonly _startTime: number;
    private readonly _aftCfg: AftConfig;
    public readonly test: TestCaseResult;
    
    constructor(scope?: any, aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._startTime = Date.now();
        if (typeof scope === 'string') {
            this.test = {
                fullName: scope,
                get duration(): number { return convert.toElapsedMs(this._startTime) / 1000; }
            } as TestCaseResult;
        }else if (scope?.['fullName']) {
            // 'scope' is a 'TestCaseResult'
            this.test = scope;
        } else if (scope?.getState?.()) {
            // 'scope' is an 'expect' object
            const state = scope.getState();
            this.test = {
                fullName: state.currentTestName,
                get duration(): number { return convert.toElapsedMs(this._startTime) / 1000; }
            } as TestCaseResult;
        }
    }

    get fullName(): string {
        return this.test?.fullName ?? 'unknown';
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