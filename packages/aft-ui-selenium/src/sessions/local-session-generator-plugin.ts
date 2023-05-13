import { AftConfig } from "aft-core";
import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin, UiSessionConfig, UiPlatform } from "aft-ui";

export class LocalSessionConfig {
    capabilities: Record<string, any> = {};
}

export class LocalSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const uisc = aftCfg.getSection(UiSessionConfig);
        const platform = uisc.uiplatform;
        const caps = await this.getCapabilities(aftCfg);
        const driver = new Builder()
            .forBrowser(platform.browser)
            .withCapabilities(caps)
            .build();
        return driver;
    }

    async getCapabilities(aftCfg: AftConfig): Promise<Capabilities> {
        const uisc = aftCfg.getSection(UiSessionConfig);
        const lbc = aftCfg.getSection(LocalSessionConfig);
        let capabilities: Capabilities = new Capabilities();
        const platform: UiPlatform = uisc.uiplatform;
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
        const optCaps: Capabilities = new Capabilities(lbc.capabilities);
        capabilities = capabilities.merge(optCaps);
        return capabilities;
    }
}