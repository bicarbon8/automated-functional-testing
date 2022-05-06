import { WebDriver, Builder, Capabilities } from "selenium-webdriver";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { BrowserSession, BrowserSessionOptions } from "./browser-session";

export interface IBrowserSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {
    url?: string;
    capabilities?: {};
}

export abstract class AbstractBrowserSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    private _url: string;
    private _caps: Capabilities;

    constructor(options?: IBrowserSessionGeneratorPluginOptions) {
        super(options);
    }

    async getUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this.optionsMgr.get('url');
        }
        return this._url;
    }

    async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        if (!this._caps) {
            let c: {} = await this.optionsMgr.get<{}>('capabilities', {});
            this._caps = new Capabilities(c);
        }
        return this._caps;
    }

    abstract override newSession(options?: BrowserSessionOptions): Promise<BrowserSession>;

    protected async createDriver(options?: BrowserSessionOptions): Promise<WebDriver> {
        if (!options?.driver) {
            if (await this.enabled()) {
                try {
                    let url: string = await this.getUrl();
                    let caps: Capabilities = await this.getCapabilities(options);
                    let driver: WebDriver = await new Builder()
                        .usingServer(url)
                        .withCapabilities(caps)
                        .build();
                    await driver.manage().setTimeouts({implicit: 1000});
                    await driver.manage().window().maximize();
                    return driver;
                } catch (e) {
                    return Promise.reject(e);
                }
            }
        }
        return options?.driver;
    }
}