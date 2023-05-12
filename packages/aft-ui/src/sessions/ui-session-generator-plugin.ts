import { AftConfig, Plugin } from "aft-core";

export class UiSessionGeneratorPlugin extends Plugin {
    getSession = async (identifier: string, aftCfg?: AftConfig): Promise<unknown> => null;
}