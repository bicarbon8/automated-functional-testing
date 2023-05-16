import { Plugin, convert } from "aft-core";
import { UiSessionConfig } from "../configuration/ui-session-config";

export class UiSessionGeneratorPlugin extends Plugin {
    override get enabled(): boolean {
        const safeName = convert.toSafeString(this.aftCfg.getSection(UiSessionConfig).generatorName, [{exclude: /[-_.\s\d]/gi, replaceWith: ''}]);
        return safeName.toLocaleLowerCase() === this.constructor.name.toLocaleLowerCase();
    }
    getSession = async (sessionOptions?: Record<string, any>): Promise<unknown> => null;
}