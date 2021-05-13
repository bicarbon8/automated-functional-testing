import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../abstract-browser-session-generator-plugin";
import { TestPlatform } from "aft-ui";
import { Capabilities } from "selenium-webdriver";
import { nameof } from "ts-simple-nameof";
import { BrowserSessionOptions } from "../browser-session";

export class SeleniumGridSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    constructor(options?: IBrowserSessionGeneratorPluginOptions) {
        super(nameof(SeleniumGridSessionGeneratorPlugin).toLowerCase(), options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
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
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}