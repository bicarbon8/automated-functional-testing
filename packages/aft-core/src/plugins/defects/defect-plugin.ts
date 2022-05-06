import { Plugin, PluginOptions } from "../plugin";
import { IDefect } from "./idefect";

export interface DefectPluginOptions extends PluginOptions {
    
}

export abstract class DefectPlugin extends Plugin<DefectPluginOptions> {
    constructor(options?: DefectPluginOptions) {
        super(options);
    }
    
    abstract getDefect(defectId: string): Promise<IDefect>;
    abstract findDefects(searchTerm: string): Promise<IDefect[]>;
}