import { BrowserSessionGeneratorPlugin, BrowserSessionGeneratorPluginOptions } from "../browser-session-generator-plugin";
import { UiPlatform } from "aft-ui";
import { Capabilities } from "selenium-webdriver";
import { BrowserSession, BrowserSessionOptions } from "../browser-session";

export class SeleniumGridSessionGeneratorPlugin extends BrowserSessionGeneratorPlugin<BrowserSessionGeneratorPluginOptions> {
    override async newUiSession(options?: BrowserSessionOptions): Promise<BrowserSession<any>> {
        const caps: Capabilities = await this.generateCapabilities(options);
        options.driver = options.driver || await this.createDriver(caps);
        return new BrowserSession<any>(options);
    }
    override async generateCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        options.uiplatform = options.uiplatform || this.uiplatform.toString();
        options.additionalCapabilities = options.additionalCapabilities || this.additionalCapabilities;
        let capabilities: Capabilities = new Capabilities();
        let platform: UiPlatform = UiPlatform.parse(options.uiplatform);
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
        const optCaps: Capabilities = new Capabilities(options.additionalCapabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}