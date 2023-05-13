import { UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPluginThrows extends UiSessionGeneratorPlugin {
    override getSession = async (sessionOptions?: Record<string, any>): Promise<unknown> => {
        throw 'fake-exception';
    }
}