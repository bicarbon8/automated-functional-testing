import { UiPlatform } from "aft-ui";
import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginOptions } from "../browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { BrowserSessionOptions } from "../browser-session";
import { SauceLabsBrowserSession, SauceLabsBrowserSessionOptions } from "./sauce-labs-browser-session";
import { buildinfo, Merge } from "aft-core";

export type SauceLabsBrowserSessionGeneratorPluginOptions = Merge<BrowserSessionGeneratorPluginOptions, {
    username?: string;
    accessKey?: string;
    tunnel?: boolean;
    tunnelIdentifier?: string;
}>;

export class SauceLabsBrowserSessionGeneratorPlugin extends BrowserSessionGeneratorPlugin<SauceLabsBrowserSessionGeneratorPluginOptions> {
    private _username: string;
    private _accessKey: string;
    private _tunnel: boolean;
    private _tunnelIdentifier: string;

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
        if (!this._tunnel) {
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

    override get url(): string {
        return super.url || 'https://ondemand.us-east-1.saucelabs.com/wd/hub/';
    }

    override async newUiSession(options?: BrowserSessionOptions): Promise<SauceLabsBrowserSession> {
        const caps: Capabilities = await this.generateCapabilities(options);
        options.driver = options.driver || await this.createDriver(caps);
        return new SauceLabsBrowserSession(options);
    }

    override async generateCapabilities(options?: SauceLabsBrowserSessionOptions): Promise<Capabilities> {
        options = options || {};
        options.uiplatform = options?.uiplatform || this.uiplatform.toString();
        options.username = options.username || this.username;
        options.accessKey = options.accessKey || this.accessKey;
        options.tunnel = options.tunnel || this.tunnel;
        options.tunnelIdentifier = options.tunnelIdentifier || this.tunnelIdentifier;
        options.resolution = options.resolution || this.resolution;
        options.logMgr = options.logMgr || this.logMgr;
        options.additionalCapabilities = options.additionalCapabilities || this.additionalCapabilities;
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = (options?.uiplatform) ? UiPlatform.parse(options.uiplatform) : this.uiplatform;
        if (platform.deviceName) {
            capabilities.set('platformName', platform.os);
            capabilities.set('platformVersion', platform.osVersion);
        } else {
            let osVersion: string = '';
            if (platform.osVersion) {
                osVersion = ' ' + platform.osVersion;
            }
            capabilities.set('platformName', `${platform.os}${osVersion}`);
        }
        if (platform.browser) {
            capabilities.set('browserName', platform.browser);
        }
        if (platform.browserVersion) {
            capabilities.set('browserVersion', platform.browserVersion);
        }
        if (platform.deviceName) {
            capabilities.set('deviceName', platform.deviceName);
        }
        capabilities.set('sauce:options', {
            'username': options.username,
            'accessKey': options.accessKey,
            'build': await buildinfo.get(),
            'name': options?.logMgr?.logName || this.logMgr.logName
        });
        let resolution: string = options?.resolution || this.resolution;
        if (resolution) {
            let opts: object = capabilities.get('sauce:options');
            opts['screenResolution'] = resolution;
            capabilities.set('sauce:options', opts);
        }
        let tunnel: boolean = options.tunnel;
        if (tunnel) {
            let opts: {} = capabilities.get('sauce:options');
            opts['tunnelIdentifier'] = options.tunnelIdentifier;
            capabilities.set('sauce:options', opts);
        }
        // overwrite the above with passed in capabilities if any
        const addlCaps: Capabilities = new Capabilities(options.additionalCapabilities);
        capabilities = capabilities.merge(addlCaps);
        return capabilities;
    }
}