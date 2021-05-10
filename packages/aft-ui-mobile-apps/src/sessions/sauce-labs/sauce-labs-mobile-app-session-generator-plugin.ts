import { TestPlatform } from "aft-ui";
import { BuildName } from "../../helpers/build-name";
import { AbstractMobileAppGridSessionGeneratorPlugin, MobileAppGridSessionGeneratorPluginOptions } from "../appium-grid/abstract-mobile-app-grid-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export interface SauceLabsMobileAppSessionGeneratorPluginOptions extends MobileAppGridSessionGeneratorPluginOptions {
    username: string;
    accesskey: string;
    tunnel?: boolean;
    tunnelId?: string;
}

export class SauceLabsMobileAppSessionGeneratorPlugin extends AbstractMobileAppGridSessionGeneratorPlugin {
    constructor(options?: SauceLabsMobileAppSessionGeneratorPluginOptions) {
        super(nameof(SauceLabsMobileAppSessionGeneratorPlugin).toLowerCase(), options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = {};
        remOpts.protocol = 'https';
        remOpts.hostname = 'ondemand.us-west-1.saucelabs.com';
        remOpts.path = '/wd/hub';
        let platform: TestPlatform = await this.getPlatform();
        if (platform.deviceName) {
            remOpts.capabilities['platformName'] = platform.os;
            remOpts.capabilities['platformVersion'] = platform.osVersion;
        } else {
            let osVersion: string = '';
            if (platform.osVersion) {
                osVersion = ' ' + platform.osVersion;
            }
            remOpts.capabilities['platformName'] = `${platform.os}${osVersion}`;
        }
        if (platform.browser) {
            remOpts.capabilities['browserName'] = platform.browser;
        }
        if (platform.browserVersion) {
            remOpts.capabilities['browserVersion'] = platform.browserVersion;
        }
        if (platform.deviceName) {
            remOpts.capabilities['deviceName'] = platform.deviceName;
        }
        remOpts.user = await this.optionsMgr.getOption<string>(nameof<SauceLabsMobileAppSessionGeneratorPluginOptions>(o => o.username));
        remOpts.key = await this.optionsMgr.getOption<string>(nameof<SauceLabsMobileAppSessionGeneratorPluginOptions>(o => o.accesskey));
        remOpts.capabilities['buildName'] = await BuildName.get();
        remOpts.capabilities['name'] = await options?.logMgr?.logName() || await this.logMgr.logName();
        let tunnel: boolean = await this.optionsMgr.getOption<boolean>(nameof<SauceLabsMobileAppSessionGeneratorPluginOptions>(o => o.tunnel), false);
        if (tunnel) {
            remOpts.capabilities['tunnelIdentifier'] = await this.optionsMgr.getOption('tunnelId');
        }
        return remOpts;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}