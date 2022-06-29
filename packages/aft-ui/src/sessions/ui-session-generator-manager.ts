import { PluginManagerWithLogging, PluginManagerWithLoggingOptions } from "aft-core";
import { UiSession, UiSessionOptions } from "./ui-session";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";

export type UiSessionGeneratorManagerOptions = PluginManagerWithLoggingOptions;

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
 *     "plugins": [{
 *         "name": "some-custom-session-plugin",
 *         "searchDirectory": "../starting/path/to/find/plugin/",
 *         "uiTestPlatform": "windows_10_chrome_87_Google Pixel XL"
 *     }]
 *   }
 *   ...
 * }
 * ```
 */
export abstract class UiSessionGeneratorManager<T extends UiSessionGeneratorPlugin<any>, Tc extends UiSessionGeneratorManagerOptions> extends PluginManagerWithLogging<T, Tc> {
    /**
     * instantiates a new Session using the 'provider' specified in 
     * configuration
     */
    abstract newUiSession(options?: UiSessionOptions): Promise<UiSession<any>>;
}