import { UiPlatform } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { BrowserStackAppAutomateApi } from "./app-automate/browserstack-app-automate-api";
import { browserstackconfig, BrowserStackConfig, BrowserStackConfigOptions } from "./configuration/browserstack-config";
import { BrowserStackMobileAppSession } from "./browserstack-mobile-app-session";
import { UploadRequest } from "./app-automate/app-automate-api-custom-types";
import { Merge } from "aft-core";

export type BrowserStackMobileAppSessionGeneratorPluginOptions = Merge<MobileAppSessionGeneratorPluginOptions, BrowserStackConfigOptions, {
    config?: BrowserStackConfig;
    api?: BrowserStackAppAutomateApi;
}>;

export class BrowserStackMobileAppSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<BrowserStackMobileAppSessionGeneratorPluginOptions> {
    private _config: BrowserStackConfig;
    private _api: BrowserStackAppAutomateApi;

    override async newUiSession(options?: MobileAppSessionOptions): Promise<BrowserStackMobileAppSession> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;
        options.driver = options.driver || await this.createDriver(options);
        return new BrowserStackMobileAppSession(options);
    }

    get config(): BrowserStackConfig {
        if (!this._config) {
            this._config = this.option('config', browserstackconfig);
        }
        return this._config;
    }

    get api(): BrowserStackAppAutomateApi {
        if (!this._api) {
            this._api = this.option('api') || new BrowserStackAppAutomateApi({config: this.config, logMgr: this.logMgr});
        }
        return this._api;
    }

    override async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.user = remOpts.user || await this.config.user();
        remOpts.key = remOpts.key || await this.config.key();
        remOpts.capabilities = remOpts.capabilities || {};
        let platform: UiPlatform = (options?.uiplatform) ? UiPlatform.parse(options.uiplatform) : this.uiplatform;
        remOpts.capabilities['os'] = remOpts.capabilities['os'] || platform.os;
        remOpts.capabilities['os_version'] = remOpts.capabilities['os_version'] || platform.osVersion;
        remOpts.capabilities['device'] = remOpts.capabilities['device'] || platform.deviceName;
        remOpts.capabilities['realMobile'] = true;
        remOpts.capabilities['browserstack.debug'] = remOpts.capabilities['browserstack.debug'] || await this.config.debug();
        remOpts.capabilities['build'] = remOpts.capabilities['build'] || await this.config.buildName();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || options?.logMgr?.logName || this.logMgr.logName;
        remOpts.capabilities['browserstack.local'] = remOpts.capabilities['browserstack.local'] || await this.config.local();
        remOpts.capabilities['browserstack.localIdentifier'] = remOpts.capabilities['browserstack.localIdentifier'] || await this.config.localIdentifier();
        return remOpts;
    }

    override async sendCommand(command: string, data?: any): Promise<any> {
        let resp: any;
        try {
            switch (command) {
                case 'upload':
                    resp = await this.api.uploadApp(data as UploadRequest);
                    break;
                case 'getApps':
                    resp = await this.api.getApps();
                    break;
                default:
                    resp = { error: `unknown command of '${command}' sent to BrowserStackMobileAppSessionGeneratorPlugin.sendCommand` };
                    break;
            }
        } catch (e) {
            return Promise.reject(e);
        }
        return resp;
    }
}