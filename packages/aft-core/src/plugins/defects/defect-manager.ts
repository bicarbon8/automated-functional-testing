import { LogManager } from "../logging/log-manager";
import { Defect } from "./defect";
import { DefectPlugin } from "./defect-plugin";
import { PluginManagerWithLogging, PluginManagerWithLoggingOptions } from "../plugin-manager-with-logging";

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
export class DefectManager extends PluginManagerWithLogging<DefectPlugin<any>, PluginManagerWithLoggingOptions> {
    async getDefect(defectId: string): Promise<Defect> {
        let defect: Defect;
        defect = await this.first()
        .then((p: DefectPlugin<any>) => p?.getDefect(defectId)
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling ${p?.constructor.name || 'unknown'}.getDefect(${defectId}) due to: ${err}`));
                return null;    
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return null;
        });
        return defect;
    }

    async findDefects(searchTerm: string): Promise<Defect[]> {
        let defects: Defect[];
        defects = await this.first()
        .then((p: DefectPlugin<any>) => p?.findDefects(searchTerm)
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling ${p?.constructor.name || 'unknown'}.findDefects(${searchTerm}) due to: ${err}`));
                return [];    
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return [];
        });
        return defects || [];
    }
}

export const defects = new DefectManager();