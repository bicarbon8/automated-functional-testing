import { UiSessionGeneratorPlugin } from "../../src/sessions/ui-session-generator-plugin";
import { FakeSessionGeneratorPluginOptions } from "./fake-session-generator-plugin";
import { FakeSession, FakeSessionOptions } from "./fake-session";

export class FakeSessionGeneratorPluginThrows extends UiSessionGeneratorPlugin<FakeSessionGeneratorPluginOptions> {
    override async newUiSession(options?: FakeSessionOptions): Promise<FakeSession> {
        throw new Error(`error in ${this.constructor.name}`);
    }
}