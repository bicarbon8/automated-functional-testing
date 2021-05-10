import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPluginManager, ISessionGeneratorPluginManagerOptions } from "aft-ui";
import { AbstractMobileAppGridSessionGeneratorPlugin } from "./appium-grid/abstract-mobile-app-grid-session-generator-plugin";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";

export interface MobileAppSessionGeneratorPluginManagerOptions extends ISessionGeneratorPluginManagerOptions {

}

export class MobileAppSessionGeneratorPluginManager extends AbstractSessionGeneratorPluginManager<AbstractMobileAppGridSessionGeneratorPlugin, MobileAppSessionGeneratorPluginManagerOptions> {
    constructor(options?: MobileAppSessionGeneratorPluginManagerOptions) {
        super(nameof(MobileAppSessionGeneratorPluginManager).toLowerCase(), options);
    }

    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return await this.getFirstEnabledPlugin()
        .then((plugin) => {
            return plugin.newSession(options);
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