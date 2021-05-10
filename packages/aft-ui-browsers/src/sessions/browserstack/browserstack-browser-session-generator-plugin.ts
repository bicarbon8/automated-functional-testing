import { TestPlatform } from "aft-ui";
import { AbstractBrowserSessionGeneratorPlugin, IBrowserSessionGeneratorPluginOptions } from "../selenium-grid/abstract-browser-session-generator-plugin";
import { BuildName } from "../../helpers/build-name";
import { Capabilities } from "selenium-webdriver";
import { nameof } from "ts-simple-nameof";
import { BrowserSessionOptions } from "../browser-session";

export interface BrowserStackBrowserSessionGeneratorPluginOptions extends IBrowserSessionGeneratorPluginOptions {
    user: string;
    key: string;
    resolution?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
}

export class BrowserStackBrowserSessionGeneratorPlugin extends AbstractBrowserSessionGeneratorPlugin {
    constructor(options?: BrowserStackBrowserSessionGeneratorPluginOptions) {
        options = options || {} as BrowserStackBrowserSessionGeneratorPluginOptions;
        options.url = options.url || 'https://hub-cloud.browserstack.com/wd/hub/';
        super(nameof(BrowserStackBrowserSessionGeneratorPlugin).toLowerCase(), options);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
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
        let resolution: string = await this.optionsMgr.getOption('resolution');
        if (resolution) {
            capabilities.set('resolution', resolution);
        }
        capabilities.set('browserstack.user', await this.optionsMgr.getOption('user'));
        capabilities.set('browserstack.key', await this.optionsMgr.getOption('key'));
        capabilities.set('browserstack.debug', await this.optionsMgr.getOption<boolean>('debug'));
        capabilities.set('build', await BuildName.get());
        capabilities.set('name', await options?.logMgr?.logName() || await this.logMgr.logName());
        let local: boolean = await this.optionsMgr.getOption<boolean>('local', false);
        if (local) {
            capabilities.set('browserstack.local', true);
            let localId: string = await this.optionsMgr.getOption('localIdentifier');
            if (localId) {
                capabilities.set('browserstack.localIdentifier', localId);
            }
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