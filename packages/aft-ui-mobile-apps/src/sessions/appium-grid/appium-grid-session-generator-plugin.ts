import { AbstractMobileAppSessionGeneratorPlugin, MobileAppCommand, MobileAppCommandResponse, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { TestPlatform } from "aft-ui";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export class AppiumGridSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    constructor(options?: MobileAppSessionGeneratorPluginOptions) {
        super(nameof(AppiumGridSessionGeneratorPlugin).toLowerCase(), options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = {};
        let platform: TestPlatform = await this.getPlatform();
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        let browserVersion = '';
        if (platform.browserVersion) {
            browserVersion = ' ' + platform.browserVersion;
        }
        remOpts.capabilities['platform'] = `${platform.os}${osVersion}`;
        remOpts.capabilities['browserName'] = `${platform.browser}${browserVersion}`;
        return remOpts;
    }
    async sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse> {
        return Promise.reject(`command '${command.commandType}' not supported`);
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}