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
 *     "browserstack-automate-session-generator",
 *     "sauce-labs-browser-session-generator"
 *   ]
 *   ...
 *   "UiSessionConfig": {
 *     "sessionGeneratorName": "browserstack_automate"
 *   }
 *   ...
 * }
 * ```
 */
export class UiSessionGeneratorManager {
    public readonly aftCfg: AftConfig;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }

    /**
     * instantiates a new Session using the `sessionGeneratorName` specified in 
     * `UiSessionConfig`
     */
    async getSession(aftCfg?: AftConfig, logMgr?: LogManager): Promise<WebDriver> {
        aftCfg ??= this.aftCfg;
        const uic = aftCfg.getSection(UiSessionConfig);
        try {
            const plugin = pluginLoader.getPluginByName<UiSessionGeneratorPlugin>(uic.sessionGeneratorName, this.aftCfg);
            return await plugin.getSession(aftCfg, logMgr);
        } catch (e) {
            logMgr?.error(`unable to generate UI session due to: ${Err.short(e)}`);
        }
    }
}