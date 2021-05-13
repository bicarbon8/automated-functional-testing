import { WebDriver, Builder, Capabilities } from "selenium-webdriver";
import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { BrowserSession, BrowserSessionOptions } from "./browser-session";

export interface IBrowserSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {
    url?: string;
    capabilities?: {};
}

export abstract class AbstractBrowserSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    private _url: string;
    private _caps: Capabilities;

    constructor(key: string, options?: IBrowserSessionGeneratorPluginOptions) {
        super(key, options);
    }

    async getUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this.optionsMgr.getOption(nameof<IBrowserSessionGeneratorPluginOptions>(o => o.url));
        }
        return this._url;
    }

    async getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities> {
        if (!this._caps) {
            let c: {} = await this.optionsMgr.getOption<{}>(nameof<IBrowserSessionGeneratorPluginOptions>(o => o.capabilities), {});
            this._caps = new Capabilities(c);
        }
        return this._caps;
    }

    async newSession(options?: BrowserSessionOptions): Promise<BrowserSession> {
        if (await this.enabled()) {
            if (!options?.driver) {
                try {
                    let url: string = await this.getUrl();
                    let caps: Capabilities = await this.getCapabilities(options);
                    let driver: WebDriver = await new Builder()
                        .usingServer(url)
                        .withCapabilities(caps)
                        .build();
                    await driver.manage().setTimeouts({implicit: 1000});
                    await driver.manage().window().maximize();
                    return new BrowserSession({
                        driver: driver,
                        logMgr: options?.logMgr || this.logMgr
                    });
                } catch (e) {
                    return Promise.reject(e);
                }
            }
            return new BrowserSession({driver: options.driver, logMgr: options.logMgr || this.logMgr});
        }
        return null;
    }
}