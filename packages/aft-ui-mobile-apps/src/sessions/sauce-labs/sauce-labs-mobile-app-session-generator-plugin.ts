import { TestPlatform } from "aft-ui";
import { BuildName } from "../../helpers/build-name";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export interface SauceLabsMobileAppSessionGeneratorPluginOptions extends MobileAppSessionGeneratorPluginOptions {
    username: string;
    accesskey: string;
    tunnel?: boolean;
    tunnelId?: string;
}

export class SauceLabsMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    constructor(options?: SauceLabsMobileAppSessionGeneratorPluginOptions) {
        super(nameof(SauceLabsMobileAppSessionGeneratorPlugin).toLowerCase(), options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = remOpts.capabilities || {};
        let platform: TestPlatform = (options?.platform) ? TestPlatform.parse(options.platform) : await this.getPlatform();
        remOpts.capabilities['platformName'] = remOpts.capabilities['platformName'] || platform.os;
        remOpts.capabilities['platformVersion'] = remOpts.capabilities['platformVersion'] || platform.osVersion;
        remOpts.capabilities['deviceName'] = remOpts.capabilities['deviceName'] || platform.deviceName;
        remOpts.user = remOpts.user || await this.optionsMgr.getOption<string>(nameof<SauceLabsMobileAppSessionGeneratorPluginOptions>(o => o.username));
        remOpts.key = remOpts.key || await this.optionsMgr.getOption<string>(nameof<SauceLabsMobileAppSessionGeneratorPluginOptions>(o => o.accesskey));
        remOpts.capabilities['buildName'] = remOpts.capabilities['buildName'] || await BuildName.get();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || await options?.logMgr?.logName() || await this.logMgr.logName();
        remOpts.capabilities['tunnelIdentifier'] = remOpts.capabilities['tunnelIdentifier'] || await this.optionsMgr.getOption('tunnelId');
        return remOpts;
    }

    async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}