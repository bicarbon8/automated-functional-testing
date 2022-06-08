import { Plugin, PluginOptions } from "../plugin";
import { Defect } from "./defect";

export type DefectPluginOptions = PluginOptions;

export abstract class DefectPlugin<T extends DefectPluginOptions> extends Plugin<T> {
    abstract getDefect(defectId: string): Promise<Defect>;
    abstract findDefects(searchTerm: string): Promise<Defect[]>;
}