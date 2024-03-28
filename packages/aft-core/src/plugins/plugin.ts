import { AftConfig, aftConfig } from "../configuration/aft-config";
import { AftLogger, aftLogger } from "../logging/aft-logger";

export class PluginConfig {
    enabled: boolean = false;
}

/**
 * class to be extended by any `Plugin` implementation
 */
export class Plugin { // eslint-disable-line no-redeclare
    private readonly _aftCfg: AftConfig;
    private readonly _aftLogger: AftLogger;
    get aftCfg(): AftConfig {
        return this._aftCfg;
    }
    get aftLogger(): AftLogger {
        return this._aftLogger;
    }
    get enabled(): boolean {
        return false;
    }
    constructor(aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
        this._aftLogger = (aftCfg) ? new AftLogger(aftCfg) : aftLogger;
    }
}