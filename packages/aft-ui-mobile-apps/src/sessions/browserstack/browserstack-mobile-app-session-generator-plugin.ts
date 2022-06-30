import { UiPlatform } from "aft-ui";
import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { BrowserStackAppAutomateApi } from "./app-automate/browserstack-app-automate-api";
import { BrowserStackMobileAppSession, BrowserStackMobileAppSessionOptions } from "./browserstack-mobile-app-session";
import { UploadRequest } from "./app-automate/app-automate-api-custom-types";
import { buildinfo, Merge } from "aft-core";

export type BrowserStackMobileAppSessionGeneratorPluginOptions = Merge<MobileAppSessionGeneratorPluginOptions, {
    user?: string;
    key?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
    apiUrl?: string;

    api?: BrowserStackAppAutomateApi;
}>;

export class BrowserStackMobileAppSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<BrowserStackMobileAppSessionGeneratorPluginOptions> {
    private _api: BrowserStackAppAutomateApi;
    private _apiUrl: string;
    private _user: string;
    private _key: string;
    private _debug: boolean;
    private _local: boolean;
    private _localIdentifier: string;

    get api(): BrowserStackAppAutomateApi {
        if (!this._api) {
            this._api = this.option('api') || new BrowserStackAppAutomateApi({
                apiUrl: this.apiUrl,
                user: this.user,
                key: this.key,
                logMgr: this.logMgr
            });
        }
        return this._api;
    }

    get apiUrl(): string {
        if (!this._apiUrl) {
            this._apiUrl = this.option('apiUrl');
        }
        return this._apiUrl;
    }

    get user(): string {
        if (!this._user) {
            this._user = this.option('user');
        }
        return this._user;
    }

    get key(): string {
        if (!this._key) {
            this._key = this.option('key');
        }
        return this._key;
    }

    get debug(): boolean {
        if (this._debug === undefined) {
            this._debug = this.option('debug', false);
        }
        return this._debug;
    }

    get local(): boolean {
        if (this._local === undefined) {
            this._local = this.option('local', false);
        }
        return this._local;
    }

    get localIdentifier(): string {
        if (!this._localIdentifier) {
            this._localIdentifier = this.option('localIdentifier');
        }
        return this._localIdentifier;
    }

    override async newUiSession(options?: MobileAppSessionOptions): Promise<BrowserStackMobileAppSession> {
        const remopts = await this.generateRemoteOptions(options);
        options.driver = options.driver || await this.createDriver(remopts);
        return new BrowserStackMobileAppSession(options);
    }

    override async generateRemoteOptions(options?: BrowserStackMobileAppSessionOptions): Promise<RemoteOptions> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.app = options.app || this.app;
        options.user = options.user || this.user;
        options.key = options.key || this.key;
        options.local = options.local || this.local;
        options.localIdentifier = options.localIdentifier || this.localIdentifier;
        options.debug = options.debug || this.debug;

        const remOpts: RemoteOptions = await super.generateRemoteOptions(options);
        remOpts.user = remOpts.user || options.user;
        remOpts.key = remOpts.key || options.key;
        remOpts.capabilities = remOpts.capabilities || {};
        const platform: UiPlatform = (options?.uiplatform) ? UiPlatform.parse(options.uiplatform) : this.uiplatform;
        remOpts.capabilities['os'] = remOpts.capabilities['os'] || platform.os;
        remOpts.capabilities['os_version'] = remOpts.capabilities['os_version'] || platform.osVersion;
        remOpts.capabilities['device'] = remOpts.capabilities['device'] || platform.deviceName;
        remOpts.capabilities['realMobile'] = true;
        remOpts.capabilities['browserstack.debug'] = remOpts.capabilities['browserstack.debug'] || options.debug;
        remOpts.capabilities['build'] = remOpts.capabilities['build'] || await buildinfo.buildName();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || options.logMgr?.logName;
        remOpts.capabilities['browserstack.local'] = remOpts.capabilities['browserstack.local'] || options.local;
        remOpts.capabilities['browserstack.localIdentifier'] = remOpts.capabilities['browserstack.localIdentifier'] || options.localIdentifier;
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