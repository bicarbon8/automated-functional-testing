import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { Err } from "../../helpers/err";
import { AftLog } from "../logging/aft-log";
import { pluginLoader } from "../plugin-loader";
import { Defect } from "./defect";
import { IDefectPlugin } from "./i-defect-plugin";

export class DefectManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<IDefectPlugin>;
    
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this.plugins = pluginLoader.getPluginsByType<IDefectPlugin>('defect', this.aftCfg);
    }
    
    async getDefect(defectId: string): Promise<Defect> {
        const plugin = this._getFirstEnabledPlugin();
        if (plugin) {
            try {
                return await plugin.getDefect(defectId);
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.getDefect(${defectId})': ${Err.short(e)}`
                });
            }
        }
        return null;
    }

    async findDefects(searchCriteria: Partial<Defect>): Promise<Defect[]> {
        const plugin = this._getFirstEnabledPlugin();
        if (plugin) {
            try {
                return await plugin.findDefects(searchCriteria);
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.findDefects(${JSON.stringify(searchCriteria)})': ${Err.short(e)}`
                });
            }
        }
        return new Array<Defect>();
    }

    private _getFirstEnabledPlugin(): IDefectPlugin {
        return this.plugins.find(p => Err.handle(() => p?.enabled));
    }
}