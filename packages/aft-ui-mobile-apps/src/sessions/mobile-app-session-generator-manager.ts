import { UiSessionGeneratorManager, UiSessionGeneratorManagerOptions } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "./mobile-app-session-generator-plugin";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { Merge } from "aft-core";

export type MobileAppSessionGeneratorManagerOptions = Merge<UiSessionGeneratorManagerOptions, MobileAppSessionGeneratorPluginOptions>;

export class MobileAppSessionGeneratorManager extends UiSessionGeneratorManager<MobileAppSessionGeneratorPlugin<any>, MobileAppSessionGeneratorManagerOptions> {
    async newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> {
        return await this.first().then(f => f.newUiSession(options)
            .catch(async (err) => {
                const l = await this.logMgr();
                await l.warn(`error in call to '${f.constructor.name}.newSession(...)' due to: ${err}`);
                return null;    
            }))
        .catch(async (err) => {
            const l = await this.logMgr();
            await l.warn(`error in call to 'plugin.newSession(...)' due to: ${err}`);
            return null;
        });
    }
    async sendCommand(command: string, data?: any): Promise<any> {
        return await this.first().then(f => f.sendCommand(command, data)
            .catch(async (err) => {
                const l = await this.logMgr();
                await l.warn(`error in call to '${f.constructor.name}.sendCommand(${command}, ${data})' due to: ${err}`);
                return null;    
            }))
        .catch(async (err) => {
            const l = await this.logMgr();
            await l.warn(`error in call to 'plugin.sendCommand(${command}, ${data})' due to: ${err}`);
            return null;
        });
    }
}

export const mobileAppSessionGeneratorMgr = new MobileAppSessionGeneratorManager();