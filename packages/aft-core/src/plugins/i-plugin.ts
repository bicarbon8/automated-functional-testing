import { AftConfig } from "../configuration/aft-config";

/**
 * interface to be implemented by any Plugin implementation
 */
export interface IPlugin {
    readonly aftCfg: AftConfig;
    readonly enabled: boolean;
    readonly pluginType: string;
}