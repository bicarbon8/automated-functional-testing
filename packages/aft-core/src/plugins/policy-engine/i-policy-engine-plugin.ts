import { ProcessingResult } from "../../helpers/custom-types";
import { IPlugin } from "../i-plugin";

export interface IPolicyEnginePlugin extends IPlugin {
    readonly pluginType: 'policy-engine';
    shouldRun(testId: string): Promise<ProcessingResult<boolean>>;
}