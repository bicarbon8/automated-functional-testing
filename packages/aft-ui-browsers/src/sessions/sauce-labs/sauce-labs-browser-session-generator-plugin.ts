import { TestPlatform } from "aft-ui";
import { BuildName } from "../../helpers/build-name";
import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../abstract-browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { BrowserSessionOptions } from "../browser-session";
import { SauceLabsBrowserSession } from "./sauce-labs-browser-session";
import { SauceLabsConfig, SauceLabsConfigOptions } from "./configuration/sauce-labs-config";

export interface SauceLabsBrowserSessionGeneratorPluginOptions extends IBrowserSessionGeneratorPluginOptions, Partial<SauceLabsConfigOptions> {
    _config?: SauceLabsConfig;
}

export class SauceLabsBrowserSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    private _cfg: SauceLabsConfig;

    constructor(options?: SauceLabsBrowserSessionGeneratorPluginOptions) {
        options = options || {} as SauceLabsBrowserSessionGeneratorPluginOptions;
        options.url = options.url || 'https://ondemand.us-east-1.saucelabs.com/wd/hub/';
        super(options);
        this._cfg = options?._config || new SauceLabsConfig(options as SauceLabsConfigOptions);
    }

    override async onLoad(): Promise<void> {
        /* do nothing */
    }

    override async newSession(options?: BrowserSessionOptions): Promise<SauceLabsBrowserSession> {
        return new SauceLabsBrowserSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString())
        });
    }

    override async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities();
        let platform: TestPlatform = await this.getPlatform();
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
            'username': await this._cfg.username(),
            'accessKey': await this._cfg.accessKey(),
            'build': await BuildName.get(),
            'name': await options?.logMgr?.logName() || await this.logMgr.logName()
        });
        let resolution: string = await this._cfg.resolution();
        if (resolution) {
            let opts: object = capabilities.get('sauce:options');
            opts['screenResolution'] = resolution;
            capabilities.set('sauce:options', opts);
        }
        let tunnel: boolean = await this._cfg.tunnel();
        if (tunnel) {
            let opts: {} = capabilities.get('sauce:options');
            opts['tunnelIdentifier'] = await this._cfg.tunnelId();
            capabilities.set('sauce:options', opts);
        }
        // overwrite the above with passed in capabilities if any
        let superCaps: Capabilities = await super.getCapabilities();
        capabilities = capabilities.merge(superCaps);
        return capabilities;
    }

    override async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}