import { Builder, Capabilities, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin, UiSessionConfig } from "aft-ui";

export class LocalSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const uisc = this.aftCfg.getSection(UiSessionConfig);
        const platform = uisc.uiplatform;
        const caps = await this.getCapabilities(sessionOptions);
        const driver = new Builder()
            .forBrowser(platform.browser)
            .withCapabilities(caps)
            .build();
        return driver;
    }

    async getCapabilities(sessionOptions?: Record<string, any>): Promise<Capabilities> {
        let capabilities: Capabilities = new Capabilities(sessionOptions);
        return capabilities;
    }
}