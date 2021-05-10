import { TestPlatform } from "aft-ui";
import { AbstractMobileAppGridSessionGeneratorPlugin, MobileAppGridSessionGeneratorPluginOptions } from "../appium-grid/abstract-mobile-app-grid-session-generator-plugin";
import { BuildName } from "../../helpers/build-name";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export interface BrowserStackMobileAppSessionGeneratorPluginOptions extends MobileAppGridSessionGeneratorPluginOptions {
    user: string;
    key: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
}

export class BrowserStackMobileAppSessionGeneratorPlugin extends AbstractMobileAppGridSessionGeneratorPlugin {
    constructor(options?: BrowserStackMobileAppSessionGeneratorPluginOptions) {
        super(nameof(BrowserStackMobileAppSessionGeneratorPlugin).toLowerCase(), options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.protocol = 'https';
        remOpts.hostname = 'hub.browserstack.com';
        remOpts.path = '/wd/hub';
        remOpts.capabilities = {};
        let platform: TestPlatform = await this.getPlatform()
        if (platform.browser) {
            remOpts.capabilities['browserName'] = platform.browser;
        }
        if (platform.browserVersion) {
            remOpts.capabilities['browser_version'] = platform.browserVersion;
        }
        if (platform.os) {
            remOpts.capabilities['os'] = platform.os;
        }
        if (platform.osVersion) {
            remOpts.capabilities['os_version'] = platform.osVersion;
        }
        if (platform.deviceName) {
            remOpts.capabilities['device'] = platform.deviceName;
            remOpts.capabilities['realMobile'] = true;
        }
        let resolution: string = await this.optionsMgr.getOption('resolution');
        if (resolution) {
            remOpts.capabilities['resolution'] = resolution;
        }
        remOpts.capabilities['browserstack.user'] = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.user));
        remOpts.capabilities['browserstack.key'] = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.key));
        remOpts.capabilities['browserstack.debug'] = await this.optionsMgr.getOption<boolean>(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.debug));
        remOpts.capabilities['build'] = await BuildName.get();
        remOpts.capabilities['name'] = await options?.logMgr?.logName() || await this.logMgr.logName();
        let local: boolean = await this.optionsMgr.getOption<boolean>(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.local), false);
        if (local) {
            remOpts.capabilities['browserstack.local'] = true;
            let localId: string = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.localIdentifier));
            if (localId) {
                remOpts.capabilities['browserstack.localIdentifier'] = localId;
            }
        }
        return remOpts;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}