import { UiPlatform } from "aft-ui";
import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginOptions } from "../browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { BrowserStackBrowserSession, BrowserStackBrowserSessionOptions } from "./browserstack-browser-session";
import { buildinfo, Merge } from "aft-core";

export type BrowserStackBrowserSessionGeneratorPluginOptions = Merge<BrowserSessionGeneratorPluginOptions, {
    user?: string;
    key?: string;
    local?: boolean;
    localIdentifier?: string;
    debug?: boolean;
}>;

export class BrowserStackBrowserSessionGeneratorPlugin extends BrowserSessionGeneratorPlugin<BrowserStackBrowserSessionGeneratorPluginOptions> {
    private _user: string;
    private _key: string;
    private _local: boolean;
    private _localIdentifier: string;
    private _debug: boolean;

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

    get local(): boolean {
        if (!this._local) {
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

    get debug(): boolean {
        if (!this._debug) {
            this._debug = this.option('debug', false);
        }
        return this._debug;
    }
    
    override get url(): string {
        return super.url || 'https://hub-cloud.browserstack.com/wd/hub/';
    }

    override async newUiSession(options?: BrowserStackBrowserSessionOptions): Promise<BrowserStackBrowserSession> {
        const caps: Capabilities = await this.generateCapabilities(options)
        options.driver = options.driver || await this.createDriver(caps);
        return new BrowserStackBrowserSession(options);
    }

    override async generateCapabilities(options?: BrowserStackBrowserSessionOptions): Promise<Capabilities> {
        options = options || {};
        options.uiplatform = options?.uiplatform || this.uiplatform.toString();
        options.user = options.user || this.user;
        options.key = options.key || this.key;
        options.debug = options.debug || this.debug;
        options.local = options.local || this.local;
        options.localIdentifier = options.localIdentifier || this.localIdentifier;
        options.resolution = options.resolution || this.resolution;
        options.logMgr = options.logMgr || this.logMgr;
        options.additionalCapabilities = options.additionalCapabilities || this.additionalCapabilities;

        let capabilities: Capabilities = new Capabilities();
        const platform = UiPlatform.parse(options.uiplatform);
        if (platform.browser) {
            capabilities.set('browserName', platform.browser);
        }
        if (platform.browserVersion) {
            capabilities.set('browser_version', platform.browserVersion);
        }
        if (platform.os) {
            capabilities.set('os', platform.os);
        }
        if (platform.osVersion) {
            capabilities.set('os_version', platform.osVersion);
        }
        if (platform.deviceName) {
            capabilities.set('device', platform.deviceName);
            capabilities.set('realMobile', 'true');
        }
        if (options.resolution) {
            capabilities.set('resolution', options.resolution);
        }
        capabilities.set('browserstack.user', options.user);
        capabilities.set('browserstack.key', options.key);
        capabilities.set('browserstack.debug', options.debug);
        capabilities.set('build', await buildinfo.get());
        capabilities.set('name', options.logMgr?.logName);
        if (options.local) {
            capabilities.set('browserstack.local', true);
            if (options.localIdentifier) {
                capabilities.set('browserstack.localIdentifier', options.localIdentifier);
            }
        }
        // overwrite the above with passed in capabilities if any
        const addlCaps: Capabilities = new Capabilities(options.additionalCapabilities);
        capabilities = capabilities.merge(addlCaps);
        return capabilities;
    }
}