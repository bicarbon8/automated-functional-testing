import { merge } from "lodash";
import { AftConfig, Err, aftConfig, aftLogger, pluginLoader } from "aft-core";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";
import { UiSessionConfig } from "../configuration/ui-session-config";

/**
 * class will get a UI Session Generator Plugin by name listed in `UiSessionConfig.sessionGeneratorName`
 * and call it's `getSession` function
 * ```
 * {
 *   "plugins": [
 *     {"name": "grid-session-generator-plugin", "searchDir": "./node_modules/"},
 *     "local-browser-session-generator-plugin"
 *   ]
 *   ...
 *   "UiSessionConfig": {
 *     "generatorName": "grid-session-generator-plugin",
 *     "options": {
 *       "url": "https://hub-cloud.browserstack.com/wd/hub"
 *       "capabilities": {
 *         "browserName": "chrome"
 *         "bstack:options": {
 *           "userName": "lkjsdlak",
 *           "accessKey": "laksdjf12312",
 *           "debug": true
 *         }
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

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this.plugins = pluginLoader.getEnabledPluginsByType(UiSessionGeneratorPlugin, this.aftCfg);
    }

    /**
     * instantiates a new Session using the `UiSessionConfig.generatorName` specified in 
     * `aftconfig.json`
     */
    async getSession(sessionOptions?: Record<string, any>): Promise<unknown> {
        const uic = this.aftCfg.getSection(UiSessionConfig);
        sessionOptions ??= {};
        sessionOptions = merge(uic.options, sessionOptions);
        try {
            const plugin = this.plugins.find(p => p); // get ONLY first result
            aftLogger.log({
                name: this.constructor.name,
                level: 'trace',
                message: `using plugin: '${plugin.constructor.name}' to generate new UI session using options: ${JSON.stringify(sessionOptions)}`
            });
            return await plugin.getSession(sessionOptions);
        } catch (e) {
            const err = `unable to generate UI session due to: ${Err.short(e)}`;
            aftLogger.log({
                name: this.constructor.name,
                level: 'error',
                message: err
            });
            return Promise.reject(err);
        }
    }
}
