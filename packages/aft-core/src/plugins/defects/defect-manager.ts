import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { LogManager } from "../logging/log-manager";
import { IDefect } from "./idefect";
import { DefectPlugin, DefectPluginOptions } from "./defect-plugin";

export interface DefectManagerOptions extends DefectPluginOptions, PluginManagerOptions {
    logMgr?: LogManager;
}

/**
 * loads and provides an interface between any `DefectPlugin`
 * to lookup defects in connected systems such as Jira, Bugzilla
 * or any other system that is used to store product defects so 
 * they can be used for test execution control (i.e. a test with
 * and associated open defect will not be executed)
 * to specify a plugin use the following `aftconfig.json` key:
 * ```
 * {
 *   ...
 *   "defectmanager": {
 *     "pluginNames": ["plugin-name"]
 *   }
 *   ...
 * }
 * ```
 */
export class DefectManager extends PluginManager<DefectPlugin, DefectPluginOptions> {
    private _logMgr: LogManager;

    constructor(options?: DefectManagerOptions) {
        super(options);
        this._logMgr = options?.logMgr || new LogManager({logName: this.optionsMgr.key, pluginNames: []});
    }
    
    async getDefect(defectId: string): Promise<IDefect> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin: DefectPlugin) => {
            return await plugin?.getDefect(defectId);
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return null;
        });
    }

    async findDefects(searchTerm: string): Promise<IDefect[]> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin: DefectPlugin) => {
            return await plugin?.findDefects(searchTerm) || [];
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return [];
        });
    }
}

export const defects = new DefectManager();