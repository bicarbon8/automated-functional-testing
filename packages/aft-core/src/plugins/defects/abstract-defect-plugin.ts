import { AbstractPlugin, IPluginOptions } from "../abstract-plugin";
import { IDefect } from "./idefect";

export interface IDefectPluginOptions extends IPluginOptions {
    
}

export abstract class AbstractDefectPlugin extends AbstractPlugin<IDefectPluginOptions> {
    constructor(options?: IDefectPluginOptions) {
        super(options);
    }
    
    abstract getDefect(defectId: string): Promise<IDefect>;
    abstract findDefects(searchTerm: string): Promise<IDefect[]>;
}