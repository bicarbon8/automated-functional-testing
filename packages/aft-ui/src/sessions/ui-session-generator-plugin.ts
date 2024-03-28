import { Plugin, convert } from "aft-core"; // eslint-disable-line no-redeclare
import { UiSessionConfig } from "../configuration/ui-session-config";

export class UiSessionGeneratorPlugin extends Plugin {
    override get enabled(): boolean {
        const uisc = this.aftCfg.getSection(UiSessionConfig);
        const genName = uisc.generatorName;
        const safeName = convert.toSafeString(genName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
        return safeName.toLocaleLowerCase() === this.constructor.name.toLocaleLowerCase();
    }
    getSession = async (sessionOptions?: Record<string, any>): Promise<unknown> => null; // eslint-disable-line no-unused-vars
}