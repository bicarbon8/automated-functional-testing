import { UiSessionGeneratorManager, UiSessionGeneratorManagerOptions } from "../../src";
import { FakeSession, FakeSessionOptions } from "./fake-session";
import { FakeSessionGeneratorPlugin } from "./fake-session-generator-plugin";

export type FakeSessionGeneratorManagerOptions = UiSessionGeneratorManagerOptions;

export class FakeSessionGeneratorManager extends UiSessionGeneratorManager<FakeSessionGeneratorPlugin, FakeSessionGeneratorManagerOptions> {
    async newUiSession(options?: FakeSessionOptions): Promise<FakeSession> {
        return await this.first()
        .then((p: FakeSessionGeneratorPlugin) => p?.newUiSession(options)
            .catch(async (err) => {
                await this.logMgr().then((l) => l.warn(`unable to call '${p?.constructor.name || 'unknown'}.newUiDriver' due to: ${err}`));
                return null;
            }))
        .catch(async (err) => {
            await this.logMgr().then((l) => l.warn(`unable to call newUiDriver due to: ${err}`));
            return null;
        });
    }
}