import { SessionGeneratorManager, SessionGeneratorManagerOptions } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "./mobile-app-session-generator-plugin";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";

export interface MobileAppSessionGeneratorManagerOptions extends SessionGeneratorManagerOptions, MobileAppSessionGeneratorPluginOptions {

}

export class MobileAppSessionGeneratorManager extends SessionGeneratorManager<MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorManagerOptions> {
    constructor(options?: MobileAppSessionGeneratorManagerOptions) {
        super(options);
    }

    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin.newSession(options);
        });
    }

    async sendCommand(command: string, data?: any): Promise<any> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin.sendCommand(command, data);
        });
    }
}

export const mobileAppSessionGeneratorMgr = new MobileAppSessionGeneratorManager();