import { AbstractPluginManager, IPluginManagerOptions } from "aft-core";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "./abstract-session-generator-plugin";
import { ISession, ISessionOptions } from "./isession";

export interface ISessionGeneratorPluginManagerOptions extends ISessionGeneratorPluginOptions, IPluginManagerOptions {
    
}

/**
 * provides configuration values under a `sessiongeneratorpluginmanager` section containing:
 * * `platform` - _[optional]_ an string containing any, none or all of the following string values: _os_, _osVersion_, _browser_, _browserVersion_, _deviceName_
 * * `loadWaitDuration` - _[optional]_ a number representing the max milliseconds to wait for a UI element (defaults to 10000 ms)
 * * `pluginNames` - an array containing any {ISessionPlugin<any, any, any>} implementations to load (NOTE: only the first enabled will be used)
 * * `searchDir` - the root directory from which to start searching for plugins (defaults to `process.cwd()`)
 * ```
 * {
 *   ...
 *   "sessiongeneratorpluginmanager": {
 *     "platform": "windows_10_chrome_87_Google Pixel XL",
 *     "loadWaitDuration": 30000,
 *     "pluginNames": ["some-custom-session-plugin"],
 *     "searchDir": "../starting/path/to/find/plugins/"
 *   }
 *   ...
 * }
 * ```
 */
export abstract class AbstractSessionGeneratorPluginManager<T extends AbstractSessionGeneratorPlugin, TOpts extends ISessionGeneratorPluginOptions> extends AbstractPluginManager<T, TOpts> {
    constructor(key: string, options?: TOpts) {
        super(key, options);
    }
    
    /**
     * instantiates a new Session using the 'provider' specified in 
     * configuration or the passed in {ISessionPluginOptions}
     * @param options optional set of configuration used when generating the session.
     * if not specified, the values from {UiConfig} will be used instead
     */
    abstract newSession(options?: ISessionOptions): Promise<ISession>;
}