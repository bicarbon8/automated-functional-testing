import { PluginManagerWithLogging, PluginManagerWithLoggingOptions, Merge, PluginConfig } from "aft-core";
import { UiPlatform } from "../configuration/ui-platform";
import { UiSession, UiSessionOptions } from "./ui-session";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";

export type UiSessionGeneratorManagerOptions = Merge<PluginManagerWithLoggingOptions, {
    uiplatform?: string;
}>;

/**
 * abstract class that should be extended by `PluginManager` instances that manage UI Session Generator Plugins
 * configuration options supported by this class are:
 * * `platform` - _[optional]_ an string containing any, none or all of the following string values: _os_, _osVersion_, _browser_, _browserVersion_, _deviceName_
 * * `loadWaitDuration` - _[optional]_ a number representing the max milliseconds to wait for a UI element (defaults to 10000 ms)
 * * `pluginNames` - an array containing any {ISessionPlugin<any, any, any>} implementations to load (NOTE: only the first enabled will be used)
 * * `searchDir` - the root directory from which to start searching for plugins (defaults to `process.cwd()`)
 * ```
 * {
 *   ...
 *   "UiSessionGeneratorManagerInstance": {
 *     "uiplatform": "mac_11_safari",
 *     "plugins": [{
 *         "name": "some-custom-session-plugin",
 *         "searchDirectory": "../starting/path/to/find/plugin/",
 *         "options": {
 *             "uiplatform": "windows_10_chrome_87_Google Pixel XL"
 *         }
 *     }]
 *   }
 *   ...
 * }
 * ```
 */
export abstract class UiSessionGeneratorManager<T extends UiSessionGeneratorPlugin<any>, Tc extends UiSessionGeneratorManagerOptions> extends PluginManagerWithLogging<T, Tc> {
    private _uiPlt: UiPlatform;

    async uiplatform(): Promise<UiPlatform> {
        if (!this._uiPlt) {
            const pltstr = await this.config('uiplatform', '+_+_+_+_+');
            this._uiPlt = UiPlatform.parse(pltstr);
        }
        return this._uiPlt;
    }

    override async pluginConfigs(): Promise<Array<string | PluginConfig>> {
        const configs = await this.config('plugins', []);
        const updatedConfigs = new Array<PluginConfig>();
        for (var i=0; i<configs.length; i++) {
            let maybeStringOrConfig = configs[i];
            if (maybeStringOrConfig) {
                let cfg: PluginConfig = {options: {}};
                if (typeof maybeStringOrConfig === 'string') {
                    cfg.name = maybeStringOrConfig;
                } else {
                    cfg = {...maybeStringOrConfig};
                }
                cfg.options = cfg.options || {};
                cfg.options['uiplatform'] = cfg.options['uiplatform'] || await this.uiplatform().then(p => p?.toString());
                cfg.options['logMgr'] = cfg.options['logMgr'] || await this.logMgr();
                updatedConfigs.push(cfg);
            }
        }
        return updatedConfigs;
    }
    
    /**
     * instantiates a new Session using the 'provider' specified in 
     * configuration
     */
    abstract newUiSession(options?: UiSessionOptions): Promise<UiSession<any>>;
}