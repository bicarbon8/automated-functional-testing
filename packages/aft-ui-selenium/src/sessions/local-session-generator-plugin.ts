import { Builder, WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorPlugin } from "aft-ui";
import { LogManager } from "aft-core";

type LocalSessionOptions = {
    browserName: string;
    capabilities: Record<string, any>;
};

export class LocalSessionGeneratorPlugin extends UiSessionGeneratorPlugin {
    override getSession = async (sessionOptions?: Record<string, any>): Promise<WebDriver> => {
        const lso = {...sessionOptions} as LocalSessionOptions;
        const caps = lso.capabilities ?? {};
        let driver: WebDriver;
        try {
            driver = new Builder()
                .forBrowser(lso.browserName ?? 'chrome')
                .withCapabilities(caps)
                .build();
        } catch (e) {
            LogManager.toConsole({name: this.constructor.name, level: 'error', message: e});
        }
        return driver;
    }
}