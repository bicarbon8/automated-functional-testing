import { AftConfig } from "aft-core";
import { UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPluginThrows extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<unknown> => {
        throw 'fake-exception';
    }
}