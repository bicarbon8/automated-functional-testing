import { AftConfig, aftConfig } from "../configuration/aft-config";

/**
 * abstract class to be implemented by any `Plugin` implementation
 */
export class Plugin {
    readonly aftCfg: AftConfig;
    enabled = false;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }
}