import { AftConfig, FileSystemMap, Reporter, aftConfig } from "aft-core";

export class AftLog {
    private _rep: Reporter;
    private readonly _aftCfg: AftConfig;
    private readonly _testNames: FileSystemMap<string, any>;
    public readonly test: jasmine.SpecResult;
    
    constructor(scope?: any, aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._testNames = new FileSystemMap<string, any>('AftJasmineReporter', [], this._aftCfg);
        if (!scope) {
            const names: Array<string> = Array.from(this._testNames.keys());
            scope = (names?.length > 0) ? names[0] : undefined;
        }
        if (typeof scope === 'string') {
            scope = {test: {fullName: scope}};
        }
        this.test = scope?.test || {};
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