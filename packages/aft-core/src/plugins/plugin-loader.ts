import * as fs from 'fs';
import * as path from 'path';
import { convert } from '../helpers/convert';
import { LogManager } from './logging/log-manager';
import { Plugin } from './plugin';

export type PluginConfig = {
    name?: string;
    searchDirectory?: string;
    options?: object;
};

class PluginLoader {
    private readonly _pluginsMap: Map<string, any>;

    constructor() {
        this._pluginsMap = new Map<string, any>();
    }

    /**
     * attempts to load plugins by name and optional path.
     * 
     * ```typescript
     * const plugins: CustomPlugin[] = pluginloader.load<CustomPlugin>([{
     *     name: 'custom-plugin', 
     *     searchDirectory: '../../plugins',
     *     enabled: false,
     *     options: {
     *         storagePath: './'
     *     }
     * }, 'custom-plugin-2']);
     * ```
     * 
     * **NOTE:** the above attempts to load a `custom-plugin` class. if loading
     * fails then it will search the filesystem, starting at the current
     * execution directory and searching all subdirectories, for a file
     * named `custom-plugin.js` which, if found, will be imported and a 
     * new instance will be created and added to the internal cache and the
     * array to be returned
     * @param pluginConfigs an array of plugin name strings or `PluginConfig` objects
     * used to locate and instantiate the plugins
     * @returns an array of singleton plugin instances of the specified type
     */
    async load<T extends Plugin<any>>(pluginConfigs: Array<string | PluginConfig>): Promise<T[]> {
        let plugins: T[] = [];
        if (pluginConfigs?.length > 0) {
            for (var i=0; i<pluginConfigs.length; i++) {
                let maybeConfigOrString = pluginConfigs[i];
                let pname: string;
                let searchDir: string = process.cwd();
                let options: object;
                if (typeof maybeConfigOrString === 'string') {
                    pname = maybeConfigOrString
                } else {
                    pname = maybeConfigOrString.name;
                    (maybeConfigOrString.searchDirectory) ? searchDir = path.join(process.cwd(), maybeConfigOrString.searchDirectory) : false;
                    options = maybeConfigOrString.options;
                }
                if (pname) {
                    if (!this._pluginsMap.has(pname)) {
                        if (!path.isAbsolute(searchDir)) {
                            searchDir = path.join(process.cwd(), searchDir);
                        }
                        this._findAndInstantiatePlugin<T>(pname, searchDir, options);
                    }
                    const p = this._pluginsMap.get(pname) as T;
                    if (p) {
                        plugins.push(p);
                    }
                }
            }
        }
        return plugins;
    }

    /**
     * clears the loaded plugins so that new plugins can be loaded
     * 
     * **DANGER** 
     * 
     * only use if you are certain you know what you are doing as this
     * can result in multiple instances of named plugins existing
     */
    clear(): void {
        this._pluginsMap.clear();
    }

    private _findAndInstantiatePlugin<T>(pluginName: string, searchRoot: string, config: PluginConfig): void {
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
                let name: string = convert.toSafeString(pluginName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
                // LogManager.toConsole({name: this.constructor.name, message: `searching for plugin constructor name for ${pluginName}...`, level: 'trace'});
                for (var i=0; i<keys.length; i++) {
                    let key: string = keys[i];
                    if (name.toLowerCase() == key.toLowerCase()) {
                        // LogManager.toConsole({name: this.constructor.name, message: `found constructor name of ${key} for ${pluginName}`, level: 'trace'});
                        constructorName = key;
                        break;
                    }
                }
                if (constructorName) {
                    const p: T = new plugin[constructorName](config);
                    this._pluginsMap.set(pluginName, p);
                }
            } catch (e) {
                throw new Error(`unable to create instance of loaded plugin '${pluginName}' due to: ${e}`);
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
            LogManager.toConsole({name: this.constructor.name, message: e, level: 'warn'});
        }
        return filePath;
    }

    private _isDir(fullFileAndPath: string): boolean {
        let isDir: boolean = false;
        try {
            const stats: fs.Stats = fs.statSync(fullFileAndPath);
            isDir = stats?.isDirectory() || false;
        } catch (e) {
            LogManager.toConsole({name: this.constructor.name, message: e, level: 'warn'});
        }
        return isDir;
    }
}

/**
 * responsible for finding and loading plugins based on a passed in 
 * `PluginConfig`. any plugin loaded by this class must extend from 
 * `Plugin<T extends PluginOptions>` and would be expected to accept an object extending
 * `PluginOptions` object in its constructor.
 * 
 * ```typescript
 * const plugins: CustomPlugin[] = pluginloader.load<CustomPlugin>([{
 *     name: 'custom-plugin', 
 *     searchDirectory: '../../plugins',
 *     enabled: false,
 *     options: {
 *         storagePath: './'
 *     }
 * }, 'custom-plugin-2']);
 * ```
 * 
 * **NOTE:** the above attempts to load a `custom-plugin` class. if loading
 * fails then it will search the filesystem, starting at the current
 * execution directory and searching all subdirectories, for a file
 * named `custom-plugin.js` which, if found, will be imported and a 
 * new instance will be created and added to the internal cache and the
 * array to be returned
 */
export const pluginloader = new PluginLoader();