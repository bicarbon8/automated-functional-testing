import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../abstract-browser-session-generator-plugin";
import { TestPlatform } from "aft-ui";
import { Capabilities } from "selenium-webdriver";
import { BrowserSession, BrowserSessionOptions } from "../browser-session";

export class SeleniumGridSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    constructor(options?: IBrowserSessionGeneratorPluginOptions) {
        super(options);
    }
    override async onLoad(): Promise<void> {
        /* do nothing */
    }
    override async newSession(options?: BrowserSessionOptions): Promise<BrowserSession> {
        return new BrowserSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString())
        });
    }
    override async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities();
        let platform: TestPlatform = await this.getPlatform();
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        let browserVersion = '';
        if (platform.browserVersion) {
            browserVersion = ' ' + platform.browserVersion;
        }
        capabilities.set('platform', `${platform.os}${osVersion}`);
        capabilities.set('browserName', `${platform.browser}${browserVersion}`);
        // overwrite the above with passed in capabilities if any
        let superCaps: Capabilities = await super.getCapabilities();
        capabilities = capabilities.merge(superCaps);
        return capabilities;
    }
    override async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}