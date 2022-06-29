import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { UiPlatform } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export type AppiumGridSessionGeneratorPluginOptions = MobileAppSessionGeneratorPluginOptions;

export class AppiumGridSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<AppiumGridSessionGeneratorPluginOptions> {
    override async newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;
        options.driver = options.driver || await this.createDriver(options);
        return new MobileAppSession(options);
    }
    override async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = {};
        let platform: UiPlatform = (options?.uiplatform) ? UiPlatform.parse(options.uiplatform) : this.uiplatform;
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        remOpts.capabilities['platform'] = `${platform.os}${osVersion}`;
        return remOpts;
    }
    override async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }
}