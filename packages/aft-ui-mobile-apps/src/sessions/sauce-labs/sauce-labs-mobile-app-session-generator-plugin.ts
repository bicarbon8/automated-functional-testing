import { UiPlatform } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { SauceLabsMobileAppSession, SauceLabsMobileAppSessionOptions } from "./sauce-labs-mobile-app-session";
import { buildinfo, Merge } from "aft-core";

export type SauceLabsMobileAppSessionGeneratorPluginOptions = Merge<MobileAppSessionGeneratorPluginOptions, {
    username?: string;
    accessKey?: string;
    tunnel?: boolean;
    tunnelIdentifier?: string;
    apiUrl?: string;
}>;

export class SauceLabsMobileAppSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<SauceLabsMobileAppSessionGeneratorPluginOptions> {
    private _username: string;
    private _accessKey: string;
    private _tunnel: boolean;
    private _tunnelIdentifier: string;
    private _apiUrl: string;

    get username(): string {
        if (!this._username) {
            this._username = this.option('username');
        }
        return this._username;
    }

    get accessKey(): string {
        if (!this._accessKey) {
            this._accessKey = this.option('accessKey');
        }
        return this._accessKey;
    }

    get tunnel(): boolean {
        if (this._tunnel === undefined) {
            this._tunnel = this.option('tunnel', false);
        }
        return this._tunnel;
    }

    get tunnelIdentifier(): string {
        if (!this._tunnelIdentifier) {
            this._tunnelIdentifier = this.option('tunnelIdentifier');
        }
        return this._tunnelIdentifier;
    }

    get apiUrl(): string {
        if (!this._apiUrl) {
            this._apiUrl = this.option('apiUrl', 'http://saucelabs.com/rest/v1/');
        }
        return this._apiUrl;
    }

    override async newUiSession(options?: MobileAppSessionOptions): Promise<SauceLabsMobileAppSession> {
        const remopts = await this.generateRemoteOptions(options);
        options.driver = options.driver || await this.createDriver(remopts);
        return new SauceLabsMobileAppSession(options);
    }

    override async generateRemoteOptions(options?: SauceLabsMobileAppSessionOptions): Promise<RemoteOptions> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;
        options.username = options.username || this.username;
        options.accessKey = options.accessKey || this.accessKey;
        options.tunnel = options.tunnel || this.tunnel;
        options.tunnelIdentifier = options.tunnelIdentifier || this.tunnelIdentifier;

        let remOpts: RemoteOptions = await super.generateRemoteOptions(options);
        remOpts.capabilities = remOpts.capabilities || {};
        const platform: UiPlatform = UiPlatform.parse(options.uiplatform);
        remOpts.capabilities['platformName'] = remOpts.capabilities['platformName'] || platform.os;
        remOpts.capabilities['platformVersion'] = remOpts.capabilities['platformVersion'] || platform.osVersion;
        remOpts.capabilities['deviceName'] = remOpts.capabilities['deviceName'] || platform.deviceName;
        remOpts.user = remOpts.user || options.username;
        remOpts.key = remOpts.key || options.accessKey;
        remOpts.capabilities['buildName'] = remOpts.capabilities['buildName'] || await buildinfo.get();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || options.logMgr?.logName;
        remOpts.capabilities['tunnel'] = remOpts.capabilities['tunnel'] || options.tunnel;
        remOpts.capabilities['tunnelIdentifier'] = remOpts.capabilities['tunnelIdentifier'] || options.tunnelIdentifier;
        remOpts.capabilities['automationName'] = remOpts.capabilities['automationName'] || 'Appium';
        return remOpts;
    }

    override async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }
}