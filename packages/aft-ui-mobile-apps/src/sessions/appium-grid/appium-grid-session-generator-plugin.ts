import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { UiPlatform } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export type AppiumGridSessionGeneratorPluginOptions = MobileAppSessionGeneratorPluginOptions;

export class AppiumGridSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<AppiumGridSessionGeneratorPluginOptions> {
    override async newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession<any>> {
        const remopts = await this.generateRemoteOptions(options);
        options.driver = options.driver || await this.createDriver(remopts);
        return new MobileAppSession<any>(options);
    }
    override async generateRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;

        let remOpts: RemoteOptions = await super.generateRemoteOptions(options);
        remOpts.capabilities = {};
        let platform: UiPlatform = UiPlatform.parse(options.uiplatform);
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