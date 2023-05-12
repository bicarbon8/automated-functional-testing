import { UiPlatform, UiSessionGeneratorPlugin } from "aft-selenium";
import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { AftConfig, BuildInfoManager, JsonObject } from "aft-core";

export class BrowserStackAutomateConfig {
    url: string = 'https://hub-cloud.browserstack.com/wd/hub/';
    user: string;
    key: string;
    local: boolean = false;
    localIdentifier: string;
    debug: boolean = false;
    uiplatform: UiPlatform;
    resolution: string = '1024x768';
    additionalCapabilities: JsonObject = {};
};

export class BrowserStackAutomateSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const bsac = aftCfg.getSection(BrowserStackAutomateConfig);
        const caps: Capabilities = await this.getCapabilities(identifier, aftCfg);
        return await new Builder()
            .usingServer(bsac.url)
            .withCapabilities(caps)
            .build();
    }
    async getCapabilities(identifier: string, aftCfg: AftConfig): Promise<Capabilities> {
        const bsac = aftCfg.getSection(BrowserStackAutomateConfig);
        const platform = bsac.uiplatform;
        const user = bsac.user;
        const key = bsac.key;
        const debug = bsac.debug;
        const local = bsac.local;
        const localIdentifier = bsac.localIdentifier;
        const resolution = bsac.resolution;
        const additionalCapabilities = bsac.additionalCapabilities;
        const buildinfo = new BuildInfoManager(aftCfg);

        let capabilities: Capabilities = new Capabilities();
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
        if (resolution) {
            capabilities.set('resolution', resolution);
        }
        capabilities.set('browserstack.user', user);
        capabilities.set('browserstack.key', key);
        capabilities.set('browserstack.debug', debug);
        capabilities.set('build', await buildinfo.get());
        capabilities.set('name', identifier);
        if (local) {
            capabilities.set('browserstack.local', true);
            if (localIdentifier) {
                capabilities.set('browserstack.localIdentifier', localIdentifier);
            }
        }
        // overwrite the above with passed in capabilities if any
        const addlCaps: Capabilities = new Capabilities(additionalCapabilities);
        capabilities = capabilities.merge(addlCaps);
        return capabilities;
    }
}