import { SessionGeneratorManager, SessionGeneratorManagerOptions } from "aft-ui";
import { BrowserSession, BrowserSessionOptions } from "./browser-session";
import { BrowserSessionGeneratorPlugin } from "./browser-session-generator-plugin";

export interface BrowserSessionGeneratorManagerOptions extends SessionGeneratorManagerOptions {

}

export class BrowserSessionGeneratorManager extends SessionGeneratorManager<BrowserSessionGeneratorPlugin, BrowserSessionGeneratorManagerOptions> {
    constructor(options?: BrowserSessionGeneratorManagerOptions) {
        super(options);
    }

    async newSession(options?: BrowserSessionOptions): Promise<BrowserSession> {
        return await this.getFirstEnabledPlugin()
        .then((plugin) => {
            return plugin.newSession(options);
        });
    }
}

export const browserSessionGeneratorMgr = new BrowserSessionGeneratorManager();