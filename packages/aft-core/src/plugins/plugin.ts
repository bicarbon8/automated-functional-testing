import { AftConfig, aftConfig } from "../configuration/aft-config";

export class PluginConfig {
    enabled: boolean = false;
}

/**
 * abstract class to be implemented by any `Plugin` implementation
 */
export class Plugin {
    private readonly _aftCfg: AftConfig;
    get aftCfg(): AftConfig {
        return aftConfig;
    }
    get enabled(): boolean {
        return false;
    }
    constructor(aftCfg?: AftConfig) {
        this._aftCfg = aftCfg ?? aftConfig;
    }
}