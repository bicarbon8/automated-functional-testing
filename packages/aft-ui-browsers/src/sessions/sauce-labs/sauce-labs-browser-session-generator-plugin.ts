import { UiPlatform } from "aft-ui";
import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginOptions } from "../browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { BrowserSessionOptions } from "../browser-session";
import { SauceLabsBrowserSession } from "./sauce-labs-browser-session";
import { buildinfo, Merge } from "aft-core";
import { saucelabsconfig, SauceLabsConfig } from "./configuration/sauce-labs-config";

export type SauceLabsBrowserSessionGeneratorPluginOptions = Merge<BrowserSessionGeneratorPluginOptions, {
    config?: SauceLabsConfig;
}>;

export class SauceLabsBrowserSessionGeneratorPlugin extends BrowserSessionGeneratorPlugin<SauceLabsBrowserSessionGeneratorPluginOptions> {
    private _config: SauceLabsConfig;

    override get url(): string {
        return super.url || 'https://ondemand.us-east-1.saucelabs.com/wd/hub/';
    }
    
    get config(): SauceLabsConfig {
        if (!this._config) {
            this._config = this.option('config', saucelabsconfig);
        }
        return this._config;
    }

    override async newUiSession(options?: BrowserSessionOptions): Promise<SauceLabsBrowserSession> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.driver = options.driver || await this.createDriver(options);
        return new SauceLabsBrowserSession(options);
    }

    override async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = this.uiplatform;
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
            'username': await this.config.username(),
            'accessKey': await this.config.accessKey(),
            'build': await buildinfo.get(),
            'name': options?.logMgr?.logName || this.logMgr.logName
        });
        let resolution: string = await this.config.resolution();
        if (resolution) {
            let opts: object = capabilities.get('sauce:options');
            opts['screenResolution'] = resolution;
            capabilities.set('sauce:options', opts);
        }
        let tunnel: boolean = await this.config.tunnel();
        if (tunnel) {
            let opts: {} = capabilities.get('sauce:options');
            opts['tunnelIdentifier'] = await this.config.tunnelId();
            capabilities.set('sauce:options', opts);
        }
        // overwrite the above with passed in capabilities if any
        const optCaps: Capabilities = new Capabilities(this.additionalCapabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}