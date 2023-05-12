import { AftConfig, JsonObject, LogManager } from "aft-core";
import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "./ui-session-generator-plugin";
import { UiPlatform } from "../configuration/ui-platform";

export class LocalBrowserConfig {
    uiplatform: UiPlatform;
    additionalCapabilities: JsonObject = {};
}

export class LocalBrowserSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const lbc = aftCfg.getSection(LocalBrowserConfig);
        const platform = lbc.uiplatform;
        const caps = await this.getCapabilities(aftCfg);
        const driver = new Builder()
            .forBrowser(platform.browser)
            .withCapabilities(caps)
            .build();
        return driver;
    }

    async getCapabilities(aftCfg: AftConfig): Promise<Capabilities> {
        aftCfg ??= this.aftCfg;
        const lbc = aftCfg.getSection(LocalBrowserConfig);
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = lbc.uiplatform;
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        let browserVersion = '';
        if (platform.browserVersion) {
            browserVersion = ' ' + platform.browserVersion;
        }
        capabilities.set('platform', `${platform.os}${osVersion}`); // results in "windows11" or "osx10" type values
        capabilities.set('browserName', `${platform.browser}${browserVersion}`); // results in "chrome113" or "firefox73" type values
        // overwrite the above with passed in capabilities if any
        const optCaps: Capabilities = new Capabilities(lbc.additionalCapabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}