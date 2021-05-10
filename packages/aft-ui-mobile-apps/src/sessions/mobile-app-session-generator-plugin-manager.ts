import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPluginManager, ISessionGeneratorPluginManagerOptions } from "aft-ui";
import { AbstractMobileAppSessionGeneratorPlugin } from "./appium-grid/abstract-mobile-app-session-generator-plugin";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { MobileAppCommand, MobileAppCommandResponse } from "./mobile-app-command";

export interface MobileAppSessionGeneratorPluginManagerOptions extends ISessionGeneratorPluginManagerOptions {

}

export class MobileAppSessionGeneratorPluginManager extends AbstractSessionGeneratorPluginManager<AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginManagerOptions> {
    constructor(options?: MobileAppSessionGeneratorPluginManagerOptions) {
        super(nameof(MobileAppSessionGeneratorPluginManager).toLowerCase(), options);
    }

    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return await this.getFirstEnabledPlugin()
        .then((plugin) => {
            return plugin.newSession(options);
        });
    }

    async sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse> {
        return await this.getFirstEnabledPlugin()
        .then((plugin) => {
            return plugin.sendCommand(command);
        });
    }
}

export module MobileAppSessionGeneratorPluginManager {
    var _inst: MobileAppSessionGeneratorPluginManager;

    export function instance(): MobileAppSessionGeneratorPluginManager {
        if (!_inst) {
            _inst = new MobileAppSessionGeneratorPluginManager();
        }
        return _inst;
    }
}