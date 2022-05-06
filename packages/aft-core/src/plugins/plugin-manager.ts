import { Plugin, PluginOptions } from "./plugin";
import { pluginloader } from "./plugin-loader";
import { OptionsManager } from "../configuration/options-manager";

/**
 * base interface that must be implemented by {options} objects
 * passed to the constructor of {PluginManager} implementations
 */
export interface PluginManagerOptions {
    /**
     * Required either in `aftconfig.json` file section for the Plugin Manager
     * or to be passed in directly to the Plugin Manager's constructor
     */
    pluginNames?: string[];
    /**
     * [OPTIONAL] a directory to start searching for Plugins from
     */
    searchDir?: string;
    /**
     * [OPTIONAL] if none specified a new {OptionsManager} will be created
     * in the constructor to manage options from either `aftconfig.json` or
     * via the passed in values
     */
    _optMgr?: OptionsManager;
}

/**
 * base class for use by classes that load in and manage plugins.
 * the `PluginManager` instances should specify their
 * plugin names to be loaded in the passed in `options` object
 * or in the `aftconfig.json` file under a section whose name
 * exactly matches the `PluginManager` instance's class name in all
 * lowercase.
 * 
 * ex: `PluginManagerInstance`
 * ```typescript
 * export interface PluginInstanceOptions extends PluginOptions {
 *     foo?: string;
 *     bar?: boolean;
 * }
 * export interface PluginManagerInstanceOptions extends PluginManagerOptions, PluginInstanceOptions {
 * 
 * }
 * export class PluginManagerInstance extends PluginManager<SomePluginInstance, PluginInstanceOptions> {
 *     constructor(options?: PluginManagerInstanceOptions) {
 *         super(options);
 *     }
 * }
 * ```
 * ex: `aftconfig.json`
 * ```json
 * {
 *   "pluginmanagerinstance": {
 *     ...
 *     "pluginNames": [
 *       "some-custom-plugin",
 *       "/full/path/to/other/plugin"
 *     ],
 *     "searchDirRoot": "./directory/to/search/for/plugins/from"
 *     "foo": "specify 'foo' for loaded plugin instances",
 *     "bar": false
 *     ...
 *   }
 * }
 * ```
 * NOTE: the `PluginManagerInstance` will load plugins listed in the `pluginNames` array
 * and pass them any additional `options` specified (in this case the values for `foo` and `bar`)
 */
export class PluginManager<T extends Plugin<Topts>, Topts extends PluginOptions> {
    private _plugins: Map<string, T>;
    private _opts: Topts;

    private _pluginNames: string[];
    private _searchDir: string;

    readonly optionsMgr: OptionsManager;

    constructor(options?: Topts) {
        this._opts = options;
        this.optionsMgr = this._opts?._optMgr || new OptionsManager(this.constructor.name.toLowerCase(), this._opts);
    }

    async getPluginNames(): Promise<string[]> {
        if (!this._pluginNames) {
            this._pluginNames = await this.optionsMgr.get('pluginNames', []);
        }
        return this._pluginNames;
    }

    async getSearchDir(): Promise<string> {
        if (!this._searchDir) {
            this._searchDir = await this.optionsMgr.get('searchDir');
        }
        return this._searchDir;
    }

    async getFirstEnabledPlugin(): Promise<T> {
        let plugins: T[] = await this.getEnabledPlugins();
        if (plugins?.length) {
            return plugins[0];
        }
        return Promise.reject(`${this.constructor.name}: unable to find enabled plugin in: [${await this.getPluginNames().then(n => n.join(','))}]`);
    }

    async getEnabledPlugins(): Promise<T[]> {
        let enabled: T[] = [];
        let plugins: T[] = await this.getPlugins();
        if (plugins?.length) {
            for (var i=0; i<plugins.length; i++) {
                let p: T = plugins[i];
                if (await p.enabled()) {
                    enabled.push(p);
                }
            }
        }
        return enabled;
    }

    /**
     * loads and caches the plugins specified either in the options passed
     * to the class constructor or within `aftconfig.json` section under a
     * property of `pluginNames` accepting an array of strings containing paths
     * to the plugin to be loaded. if no plugin is specified then nothing will
     * be loaded and `undefined` is returned
     */
    async getPlugins(): Promise<T[]> {
        if (!this._plugins) {
            this._plugins = await this._loadPlugins();
        }
        return Array.from(this._plugins.values());
    }

    private async _loadPlugins(): Promise<Map<string, T>> {
        let plugins = new Map<string, T>();
        let pNames: string[] = await this.getPluginNames();
        let searchRoot: string = await this.getSearchDir();
        if (pNames?.length) {
            for (var i=0; i<pNames.length; i++) {
                let name: string = pNames[i];
                await pluginloader.load<T>(name, searchRoot, this._opts)
                .then((p) => {
                    plugins.set(p.constructor.name, p);
                });
            }
        }
        return plugins;
    }
}