import { UiSessionConfig, UiSessionGeneratorPlugin } from "../../src";

export class FakeSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (sessionOptions?: Record<string, any>): Promise<unknown> => {
        const uisc = this.aftCfg.getSection(UiSessionConfig);
        return {
            foo: 'bar',
            uiplatform: uisc.uiplatform,
            capabilities: sessionOptions
        };
    }
}