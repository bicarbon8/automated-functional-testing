import { UiSessionConfig, UiSessionGeneratorPlugin } from "aft-ui";
import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { AftConfig, BuildInfoManager, JsonObject } from "aft-core";

export class SauceLabsBrowserConfig {
    url: string = 'https://ondemand.us-east-1.saucelabs.com/wd/hub/';
    username: string;
    accessKey: string;
    tunnel: boolean;
    tunnelIdentifier: string;
    resolution: string = '1024x768';
    additionalCapabilities: JsonObject = {};
};

export class SauceLabsBrowserSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (identifier: string, aftCfg?: AftConfig): Promise<WebDriver> => {
        aftCfg ??= this.aftCfg;
        const slbc = aftCfg.getSection(SauceLabsBrowserConfig);
        const caps: Capabilities = await this.getCapabilities(identifier, aftCfg);
        return await new Builder()
            .usingServer(slbc.url)
            .withCapabilities(caps)
            .build();
    }

    async getCapabilities(identifier: string, aftCfg: AftConfig): Promise<Capabilities> {
        const uisc = aftCfg.getSection(UiSessionConfig);
        const slbc = aftCfg.getSection(SauceLabsBrowserConfig);
        const platform = uisc.uiplatform;
        const username = slbc.username;
        const accessKey = slbc.accessKey;
        const tunnel = slbc.tunnel;
        const tunnelIdentifier = slbc.tunnelIdentifier;
        const resolution = slbc.resolution;
        const additionalCapabilities = slbc.additionalCapabilities;
        let capabilities: Capabilities = new Capabilities();
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
            'username': username,
            'accessKey': accessKey,
            'build': await new BuildInfoManager(aftCfg).get(),
            'name': identifier
        });
        if (resolution) {
            let opts: object = capabilities.get('sauce:options');
            opts['screenResolution'] = resolution;
            capabilities.set('sauce:options', opts);
        }
        if (tunnel) {
            let opts: {} = capabilities.get('sauce:options');
            opts['tunnelIdentifier'] = tunnelIdentifier;
            capabilities.set('sauce:options', opts);
        }
        // overwrite the above with passed in capabilities if any
        const addlCaps: Capabilities = new Capabilities(additionalCapabilities);
        capabilities = capabilities.merge(addlCaps);
        return capabilities;
    }
}