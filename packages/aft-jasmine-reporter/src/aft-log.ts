import { AftConfig, FileSystemMap, LogManager, aftConfig } from "aft-core";

export class AftLog {
    private _logMgr: LogManager;
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

    get logMgr(): LogManager {
        if (!this._logMgr) {
            this._logMgr = new LogManager(this.fullName)
        }
        return this._logMgr;
    }
}