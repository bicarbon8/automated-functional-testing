import { Plugin } from "./plugin";
import { PluginConfig, pluginloader } from "./plugin-loader";
import { IConfigProvider } from "../configuration/i-config-provider";
import { cfgmgr } from "../configuration/config-manager";
import { IHasConfig } from "../configuration/i-has-config";
import { IHasOptions } from "../configuration/i-has-options";

export type PluginManagerOptions = {
    plugins?: Array<string | PluginConfig>;
}

/**
 * base class for use by classes that load in and manage plugins.
 * `PluginManager` instances should specify their plugin names and
 * location in the passed in `options` object or in the 
 * `aftconfig.json` file under a section whose name
 * exactly matches the `PluginManager` instance's class name in all
 * lowercase.
 * 
 * ex: `PluginInstance`
 * ```typescript
 * export type PluginInstanceOptions = Union<PluginOptions, { foo?: string; bar?: boolean; }>;
 * export class PluginInstance extends Plugin<PluginInstanceOptions> {
 *     constructor(options?: PluginInstanceOptions) {
 *         super(options);
 *     }
 * }
 * ```
 * ex: `PluginManagerInstance`
 * ```typescript
 * export type PluginManagerInstanceOptions = Union<PluginManagerOptions, PluginInstanceOptions>;
 * export class PluginManagerInstance extends PluginManager<PluginInstance, PluginInstanceOptions> {
 *     constructor(options?: PluginManagerInstanceOptions) {
 *         super(options);
 *     }
 * }
 * ```
 * ex: `aftconfig.json`
 * ```json
 * {
 *   "PluginManagerInstance": {
 *     ...
 *     "plugins": [
 *       {"name": "some-custom-plugin", "enabled": false, "searchDirectory": "/full/path/to/search"},
 *       {"name": "a-second-plugin", "searchDirectory": "../../relative-path-to-search", "options": {"foo": "option used by plugin instance"}}
 *     ],
 *     "bar": "configurataion used by PluginManagerInstance"
 *     ...
 *   }
 * }
 * ```
 * NOTE: the `PluginManagerInstance` will load plugins listed in the `pluginNames` array
 * and pass them any additional `options` specified (in this case the values for `foo` and `bar`)
 */
export abstract class PluginManager<T extends Plugin<any>, Tc extends PluginManagerOptions> implements IHasConfig<Tc>, IHasOptions<Tc> {
    private _plugins: T[];
    private readonly _config: IConfigProvider<Tc>;
    private readonly _options: Tc;

    /**
     * allows for specifying optional configuration for the `PluginManager` that will take
     * precedence over other forms of configuration as long as the `cfgmgr` is not overridden
     * @param options an object defining configuration to be used by this `PluginManager` instance
     */
    constructor(options?: Tc) {
        this._options = options || {} as Tc;
        this._config = cfgmgr.get(this.constructor.name, options);
    }

    async config<K extends keyof Tc, V extends Tc[K]>(key: K, defaultVal?: V): Promise<V> {
        return this._config.get(key, defaultVal);
    }

    option<K extends keyof Tc, V extends Tc[K]>(key: K, defaultVal?: V): V {
        const result: V = this._options[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    async pluginConfigs(): Promise<Array<string | PluginConfig>> {
        return this.config('plugins', []);
    }
    
    /**
     * returns the array of loaded plugin instances
     */
    async plugins(): Promise<T[]> {
        if (!this._plugins) {
            this._plugins = await this.load();
        }
        return this._plugins || [];
    }

    /**
     * returns the first loaded plugin instance
     */
    async first(): Promise<T> {
        const enabled = await this.enabled();
        return (enabled?.length > 0) ? enabled[0] : null;
    }

    async enabled(): Promise<T[]> {
        const plugins = await this.plugins();
        return plugins.filter((p: T) => p.enabled);
    }

    /**
     * attempts to find the first plugin who's class name matches a specified string
     * @param ctorName the class name of the plugin
     * @returns the first plugin who's class name matched the passed in `ctorName` (both lowercase)
     */
    async named(ctorName: string): Promise<T> {
        return await this.plugins()
        .then((plugins: T[]) => plugins
            .filter((p: T) => p?.constructor.name.toLowerCase() === ctorName?.toLowerCase()))
        .catch((err) => null);
    }

    /**
     * instantiates new plugins and caches them for use at `plugins`
     * 
     * NOTE: this does not destroy previous instances, but removes them
     * from the internal array and replaces them with the new instances
     */
    async load(): Promise<T[]> {
        const pluginConfigs = await this.pluginConfigs();
        return pluginloader.load<T>(pluginConfigs) || [];
    }
}