import * as fs from 'fs';
import * as path from 'path';
import { convert } from '../helpers/converter';
import { AbstractPlugin } from './abstract-plugin';

class Loader {
    /**
     * attempts to load a package named `pluginName` and if
     * that fails will search the filesystem, starting at the current
     * execution directory and searching all subdirectories, for a file
     * named `custom-plugin.js` which, if found, will be imported and a 
     * new instance will be created followed by calling the {onLoad} function.
     * 
     * NOTE: each time this is called a new instance of the Plugin is created.
     * @param pluginName the name of the plugin package or file to be imported
     * @param options [optional] object containing options passed to the plugin constructor
     * @returns an instance of the plugin
     */
    async load<T extends AbstractPlugin<any>>(pluginName: string, searchRoot?: string, options?: any): Promise<T> {
        searchRoot = searchRoot || process.cwd();
        if (!path.isAbsolute(searchRoot)) {
            searchRoot = path.join(process.cwd(), searchRoot);
        }
        return await this._validatePlugin<T>(pluginName, searchRoot, options);
    }

    private async _validatePlugin<T extends AbstractPlugin<any>>(pluginName: string, searchRoot: string, options?: any): Promise<T> {
        let plugin: T;

        try {
            plugin  = await import(pluginName);
        } catch (e) {
            try {
                // console.debug(`searching for plugin '${pluginName}' starting at: ${searchRoot}`);
                let pathToPlugin: string = await this._findPlugin(searchRoot, `${pluginName}.js`);
                if (pathToPlugin) {
                    // console.debug(`found plugin '${pluginName}' at: ${pathToPlugin}`);
                    pathToPlugin = pathToPlugin.replace('.js', '');
                    plugin = await import(pathToPlugin);
                } else {
                    throw new Error(`plugin could not be located`);
                }
            } catch (ee) {
                return Promise.reject(`unable to load plugin: '${pluginName}' due to: ${ee}`);
            }
        }
        if (plugin) {
            try {
                let constructorName: string;
                let keys: string[] = Object.keys(plugin);
                let name: string = convert.toSafeString(pluginName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
                // console.debug(`searching for plugin constructor name for ${pluginName}...`);
                for (var i=0; i<keys.length; i++) {
                    let key: string = keys[i];
                    if (name.toLowerCase() == key.toLowerCase()) {
                        // console.debug(`found constructor name of ${key} for ${pluginName}`);
                        constructorName = key;
                        break;
                    }
                }
                let p: T = new plugin[constructorName](options);
                await p.onLoad();
                return p;
            } catch (e) {
                return Promise.reject(`unable to create instance of loaded plugin '${pluginName}' due to: ${e}`);
            }
        }
        return Promise.reject(`unable to load plugin named: '${pluginName}'`);
    }

    private async _findPlugin(dir: string, name: string): Promise<string> {
        // console.debug(`searching '${dir}' for '${name}'`);
        let filePath: string = await new Promise((resolve, reject) => {
            try {
                fs.readdir(dir, async (err, files: string[]) => {
                    if (files) {
                        for (var i=0; i<files.length; i++) {
                            let file: string = files[i];
                            let fileAndPath: string = path.resolve(dir, file);
                            let isDir: boolean = await this._isDir(fileAndPath);
                            if (isDir) {
                                let found: string = await this._findPlugin(fileAndPath, name);
                                if (found) {
                                    resolve(found);
                                    break;
                                }
                            } else {
                                if (file == name) {
                                    resolve(fileAndPath);
                                    break;
                                }
                            }
                        }
                    }
                    resolve(null);
                });
            } catch (e) {
                reject(e);
            }
        });
        return filePath;
    }

    private async _isDir(fullFileAndPath: string): Promise<boolean> {
        return await new Promise((resolve, reject) => {
            try {
                fs.stat(fullFileAndPath, (err, stats: fs.Stats) => {
                    let isDir: boolean = stats?.isDirectory() || false;
                    resolve(isDir);
                });
            } catch (e) {
                reject(e);
            }
        });
    }
}

/**
 * responsible for finding and loading plugins based on a passed in 
 * {pluginName} and optional {options}. any plugin loaded by this
 * class must extend from {AbstractPlugin<any>} and would be expected
 * to accept an {options} object in its constructor.
 * ```typescript
 * let plugin: CustomPlugin = await PluginLoader.load<CustomPlugin>('custom-plugin', {foo: 'bar'});
 * ```
 * NOTE: the above will attempt to load `custom-plugin` package and if
 * that fails will search the filesystem, starting at the current
 * execution directory and searching all subdirectories, for a file
 * named `custom-plugin.js` which, if found, will be imported and a 
 * new instance will be created followed by calling the {onLoad} function
 */
export const pluginLoader = new Loader();