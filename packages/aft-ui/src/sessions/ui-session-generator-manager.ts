import { merge } from "lodash";
import { AftConfig, Err, LogManager, aftConfig, pluginLoader } from "aft-core";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";

export class UiSessionConfig {
    generatorName: string;
    options: Record<string, any> = {};
}

/**
 * class will get a UI Session Generator Plugin by name listed in `UiSessionConfig.sessionGeneratorName`
 * and call it's `getSession` function
 * ```
 * {
 *   "pluginNames": [
 *     "grid-session-generator-plugin",
 *     "local-browser-session-generator-plugin"
 *   ]
 *   ...
 *   "UiSessionConfig": {
 *     "generatorName": "grid-session-generator-plugin",
 *     "uiplatform": {
 *       "os": "android",
 *       "osValue": "13",
 *       "browser": "chrome",
 *       "browserVersion": "112",
 *       "deviceName": "Samsung Galaxy S23"
 *     },
 *     "options": {
 *       "browserName": "chrome"
 *       "bstack:options": {
 *         "userName": "lkjsdlak",
 *         "accessKey": "laksdjf12312",
 *         "debug": true
 *       }
 *     }
 *   }
 *   ...
 * }
 * ```
 */
export class UiSessionGeneratorManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<UiSessionGeneratorPlugin>;

    private readonly _logMgr: LogManager;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this._logMgr = new LogManager(this.constructor.name, this.aftCfg);
        this.plugins = pluginLoader.getPluginsByType(UiSessionGeneratorPlugin, this.aftCfg);
    }

    /**
     * instantiates a new Session using the `sessionGeneratorName` specified in 
     * `UiSessionConfig`
     */
    async getSession(sessionOptions?: Record<string, any>): Promise<unknown> {
        const uic = this.aftCfg.getSection(UiSessionConfig);
        sessionOptions ??= {};
        sessionOptions = merge(uic.options, sessionOptions);
        try {
            const plugin = this.plugins.find(p => Err.handle(() => p?.enabled));
            await this._logMgr.debug(`using plugin: '${plugin.constructor.name}' to generate new UI session`);
            return await plugin.getSession(sessionOptions);
        } catch (e) {
            const err = `unable to generate UI session due to: ${Err.short(e)}`;
            await this._logMgr?.error(err);
            return Promise.reject(err);
        }
    }
}