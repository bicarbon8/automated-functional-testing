import { TestPlatform } from "aft-ui";
import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../abstract-browser-session-generator-plugin";
import { BuildName } from "../../helpers/build-name";
import { Capabilities, WebDriver } from "selenium-webdriver";
import { nameof } from "ts-simple-nameof";
import { BrowserSessionOptions } from "../browser-session";
import { BrowserStackConfig, BrowserStackConfigOptions } from "./configuration/browserstack-config";
import { BrowserStackBrowserSession } from "./browserstack-browser-session";

export interface BrowserStackBrowserSessionGeneratorPluginOptions extends IBrowserSessionGeneratorPluginOptions, Partial<BrowserStackConfigOptions> {
    _config?: BrowserStackConfig;
}

export class BrowserStackBrowserSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    private _cfg: BrowserStackConfig;
    
    constructor(options?: BrowserStackBrowserSessionGeneratorPluginOptions) {
        options = options || {} as BrowserStackBrowserSessionGeneratorPluginOptions;
        options.url = options.url || 'https://hub-cloud.browserstack.com/wd/hub/';
        super(nameof(BrowserStackBrowserSessionGeneratorPlugin).toLowerCase(), options);
        this._cfg = options?._config || new BrowserStackConfig(options as BrowserStackConfigOptions);
    }

    override async onLoad(): Promise<void> {
        /* do nothing */
    }

    override async newSession(options?: BrowserSessionOptions): Promise<BrowserStackBrowserSession> {
        return new BrowserStackBrowserSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString())
        });
    }

    override async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities();
        let platform: TestPlatform = await this.getPlatform()
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
        let resolution: string = await this._cfg.resolution();
        if (resolution) {
            capabilities.set('resolution', resolution);
        }
        capabilities.set('browserstack.user', await this._cfg.user());
        capabilities.set('browserstack.key', await this._cfg.key());
        capabilities.set('browserstack.debug', await this._cfg.debug());
        capabilities.set('build', await BuildName.get());
        capabilities.set('name', await options?.logMgr?.logName() || await this.logMgr.logName());
        let local: boolean = await this._cfg.local();
        if (local) {
            capabilities.set('browserstack.local', true);
            let localId: string = await this._cfg.localIdentifier();
            if (localId) {
                capabilities.set('browserstack.localIdentifier', localId);
            }
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