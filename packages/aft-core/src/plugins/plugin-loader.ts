import * as process from 'node:process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { convert } from '../helpers/convert';
import { Plugin } from './plugin'; // eslint-disable-line no-redeclare
import { AftConfig, aftConfig } from '../configuration/aft-config';
import { Class } from '../helpers/custom-types';
import { havingProps } from '../verification/verifier-matcher';

class PluginLoader {
    private readonly _pluginsMap: Map<string, Plugin>;
    private _loaded: boolean;
    
    constructor() {
        this._pluginsMap = new Map<string, Plugin>();
        this._loaded = false;
    }

    private _load(aftCfg?: AftConfig): void {
        if (!this._loaded) {
            aftCfg ??= aftConfig;
            for (const pname of aftCfg.pluginNames ?? []) {
                const searchDir: string = (path.isAbsolute(aftCfg.pluginsSearchDir ?? ".")) 
                    ? aftCfg.pluginsSearchDir : path.join(process.cwd(), aftCfg.pluginsSearchDir);
                if (!this._pluginsMap.has(pname)) {
                    this._findAndInstantiatePlugin(pname, searchDir, aftCfg);
                }
            }
            this._loaded = true;
        }
    }

    /**
     * iterates over all plugins listed in `AftConfig.pluginNames` looking for any that 
     * extend the passed in `clazz` and returns those that do as an array of objects.
     * ex: 
     * ```typescript
     * const reportingPlugins = pluginloader.getPluginsByType(ReportingPlugin);
     * // ReportingPlugins will all extend from ReportingPlugin base class
     * ```
     * 
     * NOTE: if this is the first time the `pluginloader` is being called then plugins will
     * also be loaded
     * @param clazz a `Class<T: Plugin>` base class like `ReportingPlugin` that must be extended
     * by any of the objects returned by this call
     * @param aftCfg an optional `AftConfig` instance to use when loading plugins if not
     * already loaded
     * @returns an array of plugin objects that all extend the passed in `clazz` class
     */
    getPluginsByType<T extends Plugin>(clazz: Class<T>, aftCfg?: AftConfig): Array<T> {
        this._load(aftCfg);
        const plugins = new Array<T>();
        const classInst = new clazz();
        for (const pKey of this._pluginsMap.keys()) {
            const plugin = this._pluginsMap.get(pKey);
            const isMatch = havingProps(classInst, 1).setActual(plugin).compare();
            if (isMatch) {
                plugins.push(plugin as T);
            }
        }
        return plugins;
    }

    /**
     * iterates over all plugins listed in `AftConfig.pluginNames` looking for any that 
     * extend the passed in `clazz` and are enabled and returns those that do as an
     * array of objects.
     * ex: 
     * ```typescript
     * const reportingPlugins = pluginloader.getEnabledPluginsByType(ReportingPlugin);
     * // ReportingPlugins will all extend from ReportingPlugin base class and be enabled
     * ```
     * 
     * NOTE: if this is the first time the `pluginloader` is being called then plugins will
     * also be loaded
     * @param clazz a `Class<T: Plugin>` base class like `ReportingPlugin` that must be extended
     * by any of the objects returned by this call
     * @param aftCfg an optional `AftConfig` instance to use when loading plugins if not
     * already loaded
     * @returns an array of plugin objects that all extend the passed in `clazz` class
     */
    getEnabledPluginsByType<T extends Plugin>(clazz: Class<T>, aftCfg?: AftConfig): Array<T> {
        const plugins: Array<T> = this.getPluginsByType<T>(clazz, aftCfg);
        return plugins.filter(e => e?.enabled);
    }

    /**
     * returns a plugin by it's name
     * ex: 
     * ```typescript
     * let TestExecutionPolicyPlugin = pluginloader.getPluginByName<TestRailTestExecutionPolicyPlugin>('testrail-test-execution-policy-plugin');
     * // TestExecutionPolicyPlugin will be `undefined` if not found
     * ```
     * 
     * NOTE: if this is the first time the `pluginloader` is being called then plugins will
     * also be loaded
     * @param pluginName the name of the plugin package or file like `html-reporting-plugin`
     * @param aftCfg an optional `AftConfig` instance to use when loading plugins if not
     * already loaded
     * @returns the requested plugin or `undefined` if not found
     */
    getPluginByName<T extends Plugin>(pluginName: string, aftCfg?: AftConfig): T {
        this._load(aftCfg);
        return this._pluginsMap.get(pluginName) as T;
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

    private _findAndInstantiatePlugin(pluginName: string, searchRoot: string, aftCfg: AftConfig): void {
        let plugin: Plugin;
        let pathToPlugin: string;
        try {
            pathToPlugin = this._findPlugin(searchRoot, new RegExp(`^${pluginName}\.js$`)); // eslint-disable-line no-useless-escape
            if (pathToPlugin) {
                plugin = require(pathToPlugin); // eslint-disable-line no-undef
            } else {
                throw new Error(`plugin could not be located`);
            }
        } catch (ee) {
            throw new Error(`unable to load plugin: '${pluginName}' from '${pathToPlugin ?? searchRoot}' due to: ${ee}`);
        }

        if (plugin) {
            try {
                let constructorName: string;
                const keys: string[] = Object.keys(plugin);
                const name = convert.toSafeString(pluginName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
                for (const key of keys) {
                    if (name.toLowerCase() == key.toLowerCase()) {
                        constructorName = key;
                        break;
                    }
                }
                if (constructorName) {
                    const p: Plugin = new plugin[constructorName](aftCfg);
                    this._pluginsMap.set(pluginName, p);
                }
            } catch (e) {
                throw new Error(`unable to create instance of loaded plugin '${pluginName}' due to: ${e}`);
            }
        }
    }

    private _findPlugin(dir: string, name: string | RegExp): string {
        let filePath: string;
        try {
            const filesOrDirectories: string[] = fs.readdirSync(dir);
            if (filesOrDirectories) {
                for (const fileOrDirectory of filesOrDirectories) {
                    const fileAndPath: string = path.join(dir, fileOrDirectory);
                    const isDir: boolean = this._isDir(fileAndPath);
                    if (isDir) {
                        const found: string = this._findPlugin(fileAndPath, name);
                        if (found) {
                            filePath = found;
                        }
                    } else {
                        if (fileOrDirectory.match(name)) {
                            filePath = fileAndPath;
                            break;
                        }
                    }
                }
            } else {
                throw new Error(`no files found at path: '${dir}'`);
            }
        } catch (e) {
            /* ignore */
        }
        return filePath;
    }

    private _isDir(fullFileAndPath: string): boolean {
        let isDir: boolean = false;
        try {
            const stats: fs.Stats = fs.statSync(fullFileAndPath);
            isDir = stats?.isDirectory() || false;
        } catch (e) {
            /* ignore */
        }
        return isDir;
    }
}

/**
 * attempts to load plugins by name and optional path.
 * 
 * ```json
 * // aftconfig.json
 * {
 *   "pluginsSearchDir": "../",
 *   "pluginNames": [
 *     "testrail-reporting-plugin",
 *     "testrail-test-execution-policy-plugin"
 *     "html-reporting-plugin"
 *   ]
 * }
 * ```
 * 
 * **NOTE:** the above will attempt to load a `testrail-reporting-plugin`,
 * `testrail-test-execution-policy-plugin` and `html-reporting-plugin` class. if loading
 * fails then it will search the filesystem, starting at the relative
 * `pluginsSearchDir` path (relative to current nodejs execution dir)
 * and searching all subdirectories, for a file named `custom-plugin.js` 
 * which, if found, will be imported and a new instance will be created 
 * and added to the internal cache and the array to be returned
 */
export const pluginLoader = new PluginLoader();
