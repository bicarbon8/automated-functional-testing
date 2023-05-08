import { IPlugin } from "../i-plugin";
import { Defect } from "./defect";

export interface IDefectPlugin extends IPlugin {
    readonly pluginType: 'defect'
    getDefect(defectId: string): Promise<Defect>;
    findDefects(searchCriteria: Partial<Defect>): Promise<Defect[]>;
}