import { UiPlatform } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { SauceLabsMobileAppSession } from "./sauce-labs-mobile-app-session";
import { saucelabsconfig, SauceLabsConfig } from "./configuration/sauce-labs-config";
import { buildinfo, Merge } from "aft-core";

export type SauceLabsMobileAppSessionGeneratorPluginOptions = Merge<MobileAppSessionGeneratorPluginOptions, {
    config?: SauceLabsConfig;
}>;

export class SauceLabsMobileAppSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<SauceLabsMobileAppSessionGeneratorPluginOptions> {
    private _cfg: SauceLabsConfig;

    get config(): SauceLabsConfig {
        if (!this._cfg) {
            this._cfg = this.option('config', saucelabsconfig);
        }
        return this._cfg;
    }

    override async newUiSession(options?: MobileAppSessionOptions): Promise<SauceLabsMobileAppSession> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;
        options.driver = options.driver || await this.createDriver(options);
        return new SauceLabsMobileAppSession(options);
    }

    override async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = remOpts.capabilities || {};
        let platform: UiPlatform = (options?.uiplatform) ? UiPlatform.parse(options.uiplatform) : this.uiplatform;
        remOpts.capabilities['platformName'] = remOpts.capabilities['platformName'] || platform.os;
        remOpts.capabilities['platformVersion'] = remOpts.capabilities['platformVersion'] || platform.osVersion;
        remOpts.capabilities['deviceName'] = remOpts.capabilities['deviceName'] || platform.deviceName;
        remOpts.user = remOpts.user || await this.config.username();
        remOpts.key = remOpts.key || await this.config.accessKey();
        remOpts.capabilities['buildName'] = remOpts.capabilities['buildName'] || await buildinfo.get();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || options?.logMgr?.logName || this.logMgr.logName;
        remOpts.capabilities['tunnelIdentifier'] = remOpts.capabilities['tunnelIdentifier'] || await this.config.tunnelId();
        remOpts.capabilities['automationName'] = remOpts.capabilities['automationName'] || 'Appium';
        return remOpts;
    }

    override async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }
}