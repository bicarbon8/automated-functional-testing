import { TestPlatform } from "aft-ui";
import { BuildName } from "../../helpers/build-name";
import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../abstract-browser-session-generator-plugin";
import { Capabilities } from "selenium-webdriver";
import { nameof } from "ts-simple-nameof";
import { BrowserSessionOptions } from "../browser-session";

export interface SauceLabsBrowserSessionGeneratorPluginOptions extends IBrowserSessionGeneratorPluginOptions {
    username: string;
    accesskey: string;
    resolution?: string;
    tunnel?: boolean;
    tunnelId?: string;
}

export class SauceLabsBrowserSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    constructor(options?: SauceLabsBrowserSessionGeneratorPluginOptions) {
        options = options || {} as SauceLabsBrowserSessionGeneratorPluginOptions;
        options.url = options.url || 'https://ondemand.us-east-1.saucelabs.com/wd/hub/';
        super(nameof(SauceLabsBrowserSessionGeneratorPlugin).toLowerCase(), options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
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
            'username': await this.optionsMgr.getOption('username'),
            'accessKey': await this.optionsMgr.getOption('accesskey'),
            'build': await BuildName.get(),
            'name': await options?.logMgr?.logName() || await this.logMgr.logName()
        });
        let resolution: string = await this.optionsMgr.getOption('resolution');
        if (resolution) {
            let opts: object = capabilities.get('sauce:options');
            opts['screenResolution'] = resolution;
            capabilities.set('sauce:options', opts);
        }
        let tunnel: boolean = await this.optionsMgr.getOption<boolean>('tunnel', false);
        if (tunnel) {
            let opts: {} = capabilities.get('sauce:options');
            opts['tunnelIdentifier'] = await this.optionsMgr.getOption('tunnelId');
            capabilities.set('sauce:options', opts);
        }
        // overwrite the above with passed in capabilities if any
        let superCaps: Capabilities = await super.getCapabilities();
        capabilities = capabilities.merge(superCaps);
        return capabilities;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}