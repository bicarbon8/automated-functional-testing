import { UiPlatform } from "aft-ui";
import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginOptions } from "../browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { BrowserSessionOptions } from "../browser-session";
import { BrowserStackBrowserSession } from "./browserstack-browser-session";
import { buildinfo, Merge } from "aft-core";
import { browserstackconfig, BrowserStackConfig } from "./configuration/browserstack-config";

export type BrowserStackBrowserSessionGeneratorPluginOptions = Merge<BrowserSessionGeneratorPluginOptions, {
    config?: BrowserStackConfig;
}>;

export class BrowserStackBrowserSessionGeneratorPlugin extends BrowserSessionGeneratorPlugin<BrowserStackBrowserSessionGeneratorPluginOptions> {
    private _config: BrowserStackConfig;
    
    override get url(): string {
        return super.url || 'https://hub-cloud.browserstack.com/wd/hub/';
    }

    get config(): BrowserStackConfig {
        if (!this._config) {
            this._config = this.option('config', browserstackconfig);
        }
        return this._config;
    }

    override async newUiSession(options?: BrowserSessionOptions): Promise<BrowserStackBrowserSession> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.driver = options.driver || await this.createDriver(options);
        return new BrowserStackBrowserSession(options);
    }

    override async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = this.uiplatform
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
        let resolution: string = await this.config.resolution();
        if (resolution) {
            capabilities.set('resolution', resolution);
        }
        capabilities.set('browserstack.user', await this.config.user());
        capabilities.set('browserstack.key', await this.config.key());
        capabilities.set('browserstack.debug', await this.config.debug());
        capabilities.set('build', await buildinfo.get());
        capabilities.set('name', options?.logMgr?.logName || this.logMgr.logName);
        let local: boolean = await this.config.local();
        if (local) {
            capabilities.set('browserstack.local', true);
            let localId: string = await this.config.localIdentifier();
            if (localId) {
                capabilities.set('browserstack.localIdentifier', localId);
            }
        }
        // overwrite the above with passed in capabilities if any
        const optCaps: Capabilities = new Capabilities(this.additionalCapabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}