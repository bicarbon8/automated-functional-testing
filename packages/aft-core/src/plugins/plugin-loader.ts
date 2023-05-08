import * as fs from 'fs';
import * as path from 'path';
import { convert } from '../helpers/convert';
import { AftLog } from './logging/aft-log';
import { IPlugin } from './i-plugin';
import { AftConfig, aftConfig } from '../configuration/aft-config';
import { Err } from '../helpers/err';

class PluginLoader {
    private readonly _pluginsMap: Map<string, IPlugin>;
    private _loaded: boolean;

    constructor() {
        this._pluginsMap = new Map<string, IPlugin>();
        this._loaded = false;
    }

    private _load<T extends IPlugin>(aftCfg?: AftConfig): void {
        if (!this._loaded) {
            aftCfg ??= aftConfig;
            for (var pname of aftCfg.pluginNames ?? []) {
                let name = convert.toSafeString(pname, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
                let searchDir: string = (path.isAbsolute(aftCfg.pluginsSearchDir ?? ".")) 
                    ? aftCfg.pluginsSearchDir : path.join(process.cwd(), aftCfg.pluginsSearchDir);
                if (name) {
                    if (!this._pluginsMap.has(name)) {
                        this._findAndInstantiatePlugin<T>(name, searchDir, aftCfg);
                    }
                }
            }
            this._loaded = true;
        }
    }

    /**
     * iterates over all plugins listed in `AftConfig.pluginNames` looking for any that 
     * extend the passed in `typeName` and returns those that do as an array of objects.
     * ex: 
     * ```typescript
     * let loggingPlugins = pluginloader.getPluginsByType(LoggingPlugin);
     * // loggingPlugins will all extend from LoggingPlugin class
     * ```
     * 
     * NOTE: if this is the first time the `pluginloader` is being called then plugins will
     * also be loaded
     * @param typeName a `Class<T: Plugin>` base class like `LoggingPlugin` that must be extended
     * by any of the objects returned by this call
     * @param aftCfg an optional `AftConfig` instance to use when loading plugins if not
     * already loaded
     * @returns an array of plugin objects that all extend the passed in `typeName` class
     */
    getPluginsByType<T extends IPlugin>(typeName: string, aftCfg?: AftConfig): Array<T> {
        this._load<T>(aftCfg);
        let plugins = new Array<T>();
        for (var key of this._pluginsMap.keys()) {
            let plugin = this._pluginsMap.get(key);
            if (plugin.pluginType?.toLowerCase() === typeName.toLowerCase()) {
                plugins.push(plugin as T);
            }
        }
        return plugins;
    }

    /**
     * returns a plugin by it's name
     * ex: 
     * ```typescript
     * let testCasePlugin = pluginloader.getPluginByName<TestRailTestCasePlugin>('testrail-test-case-plugin');
     * // testCasePlugin will be `undefined` if not found
     * ```
     * 
     * NOTE: if this is the first time the `pluginloader` is being called then plugins will
     * also be loaded
     * @param pluginName the name of the plugin package or file like `html-logging-plugin`
     * @param aftCfg an optional `AftConfig` instance to use when loading plugins if not
     * already loaded
     * @returns the requested plugin or `undefined` if not found
     */
    getPluginByName<T extends IPlugin>(pluginName: string, aftCfg?: AftConfig): T {
        this._load<T>(aftCfg);
        let name = convert.toSafeString(pluginName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
        return this._pluginsMap.get(name) as T;
    }

    private _getPluginBaseClasses(plugin: unknown, baseClasses?: Array<string>): Array<string> {
        baseClasses ??= new Array<string>();
        if (plugin) {
            let baseClass = Object.getPrototypeOf(plugin);
            if (baseClass) {
                let baseClassName = baseClass.name;
                baseClasses.push(baseClassName);
                baseClasses = this._getPluginBaseClasses(baseClass, baseClasses);
            }
        }
        return baseClasses;
    }

    /**
     * clears the cached plugins so that new plugins can be loaded
     * 
     * **DANGER** 
     * 
     * only use if you are certain you know what you are doing as this
     * can result in multiple instances of named plugins existing
     */
    reset(): void {
        this._pluginsMap.clear();
        this._loaded = false;
    }

    private _findAndInstantiatePlugin<T extends IPlugin>(pluginName: string, searchRoot: string, aftCfg: AftConfig): void {
        let plugin: T;
        
        try {
            // LogManager.toConsole({name: this.constructor.name, message: `searching for plugin '${pluginName}' starting at: ${searchRoot}`, level: 'trace'});
            let pathToPlugin: string = this._findPlugin(searchRoot, new RegExp(`^${pluginName}\.js$`));
            if (pathToPlugin) {
                // LogManager.toConsole({name: this.constructor.name, message: `found plugin '${pluginName}' at: ${pathToPlugin}`, level: 'trace'});
                plugin = require(pathToPlugin);
            } else {
                throw new Error(`plugin could not be located`);
            }
        } catch (ee) {
            throw new Error(`unable to load plugin: '${pluginName}' from within directory '${searchRoot}' due to: ${ee}`);
        }

        if (plugin) {
            try {
                let constructorName: string;
                let keys: string[] = Object.keys(plugin);
                // LogManager.toConsole({name: this.constructor.name, message: `searching for plugin constructor name for ${pluginName}...`, level: 'trace'});
                for (var i=0; i<keys.length; i++) {
                    let key: string = keys[i];
                    if (pluginName.toLowerCase() == key.toLowerCase()) {
                        // LogManager.toConsole({name: this.constructor.name, message: `found constructor name of ${key} for ${pluginName}`, level: 'trace'});
                        constructorName = key;
                        break;
                    }
                }
                if (constructorName) {
                    const p: T = new plugin[constructorName](aftCfg);
                    this._pluginsMap.set(pluginName, p);
                }
            } catch (e) {
                throw new Error(`unable to create instance of loaded plugin '${pluginName}' due to: ${Err.short(e)}`);
            }
        }
    }

    private _findPlugin(dir: string, name: string | RegExp): string {
        // LogManager.toConsole({name: this.constructor.name, message: `searching '${dir}' for '${name}'`, level: 'debug'});
        let filePath: string;
        try {
            const filesOrDirectories: string[] = fs.readdirSync(dir);
            if (filesOrDirectories) {
                for (var i=0; i<filesOrDirectories.length; i++) {
                    let fileOrDirectory: string = filesOrDirectories[i];
                    let fileAndPath: string = path.join(dir, fileOrDirectory);
                    let isDir: boolean = this._isDir(fileAndPath);
                    if (isDir) {
                        let found: string = this._findPlugin(fileAndPath, name);
                        if (found) {
                            filePath = found;
                        }
                    } else {
                        if (fileOrDirectory.match(name)) {
                            filePath = fileAndPath;
                        }
                    }
                }
            } else {
                throw `no files found at path: '${dir}'`;
            }
        } catch (e) {
            AftLog.toConsole({name: this.constructor.name, message: e, logLevel: 'warn'});
        }
        return filePath;
    }

    private _isDir(fullFileAndPath: string): boolean {
        let isDir: boolean = false;
        try {
            const stats: fs.Stats = fs.statSync(fullFileAndPath);
            isDir = stats?.isDirectory() || false;
        } catch (e) {
            AftLog.toConsole({name: this.constructor.name, message: e, logLevel: 'warn'});
        }
        return isDir;
    }
}

/**
 * attempts to load plugins by name and optional path.
 * 
 * ```typescript
 * // aftconfig.json
 * {
 *   "pluginsSearchDir": "../",
 *   "pluginNames": [
 *     "testrail-logging-plugin",
 *     "testrail-test-case-plugin"
 *     "html-logging-plugin"
 *   ]
 * }
 * ```
 * 
 * **NOTE:** the above will attempt to load a `testrail-logging-plugin`,
 * `testrail-test-case-plugin` and `html-logging-plugin` class. if loading
 * fails then it will search the filesystem, starting at the relative
 * `pluginsSearchDir` path (relative to current nodejs execution dir)
 * and searching all subdirectories, for a file named `custom-plugin.js` 
 * which, if found, will be imported and a new instance will be created 
 * and added to the internal cache and the array to be returned
 * @param cfgMgr the `AftConfig` instace containing a `pluginsSearchDir` string
 * and a `pluginNames` array used to locate and load plugins
 * used to locate and instantiate the plugins
 */
export const pluginLoader = new PluginLoader();