import { AftConfig, Err, LogManager, aftConfig, pluginLoader } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";

export class UiSessionConfig {
    sessionGeneratorName: string;
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
 *     "sessionGeneratorName": "selenium-grid-session-generator-plugin"
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
    async getSession(identifier: string, aftCfg?: AftConfig): Promise<WebDriver> {
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