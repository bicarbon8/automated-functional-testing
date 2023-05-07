import { ConfigManager } from "../configuration/config-manager";

/**
 * interface to be implemented by any Plugin implementation
 */
export interface IPlugin {
    readonly cfgMgr: ConfigManager;
    readonly enabled: boolean;
    readonly pluginType: string;
}