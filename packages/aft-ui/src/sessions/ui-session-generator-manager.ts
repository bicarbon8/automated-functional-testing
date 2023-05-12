import { AftConfig, Err, LogManager, aftConfig, pluginLoader } from "aft-core";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";
import { UiPlatform } from "../configuration/ui-platform";

export class UiSessionConfig {
    sessionGeneratorName: string;
    uiplatform: UiPlatform;
}

/**
 * class will get a UI Session Generator Plugin by name listed in `UiSessionConfig.sessionGeneratorName`
 * and call it's `getSession` function
 * ```
 * {
 *   "pluginNames": [
 *     "selenium-grid-session-generator-plugin",
 *     "local-browser-session-generator-plugin"
 *   ]
 *   ...
 *   "UiSessionConfig": {
 *     "sessionGeneratorName": "selenium-grid-session-generator-plugin",
 *     "uiplatform": {
 *       "os": "android",
 *       "osValue": "13",
 *       "browser": "chrome",
 *       "browserVersion": "112",
 *       "deviceName": "Samsung Galaxy S23"
 *     }
 *   }
 *   ...
 * }
 * ```
 */
export class UiSessionGeneratorManager {
    public readonly aftCfg: AftConfig;

    private readonly _logMgr: LogManager;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this._logMgr = new LogManager(this.constructor.name, this.aftCfg);
    }

    /**
     * instantiates a new Session using the `sessionGeneratorName` specified in 
     * `UiSessionConfig`
     */
    async getSession(identifier: string, aftCfg?: AftConfig): Promise<unknown> {
        aftCfg ??= this.aftCfg;
        const uic = aftCfg.getSection(UiSessionConfig);
        try {
            const plugin = pluginLoader.getPluginByName<UiSessionGeneratorPlugin>(uic.sessionGeneratorName, this.aftCfg);
            return await plugin.getSession(identifier, aftCfg);
        } catch (e) {
            const err = `unable to generate UI session due to: ${Err.short(e)}`;
            this._logMgr?.error(err);
            return Promise.reject(err);
        }
    }
}