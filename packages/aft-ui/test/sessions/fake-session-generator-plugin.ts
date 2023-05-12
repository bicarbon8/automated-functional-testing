import { AftConfig } from "aft-core";
import { UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<unknown> => {
        return {
            foo: 'bar'
        };
    }
}