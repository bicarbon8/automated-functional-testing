import { WebDriver, Builder, Capabilities } from "selenium-webdriver";
import { UiPlatform, UiSessionGeneratorPlugin, UiSessionGeneratorPluginOptions } from "aft-ui";
import { BrowserSessionOptions } from "./browser-session";
import { Merge } from "aft-core";

export type BrowserSessionGeneratorPluginOptions = Merge<UiSessionGeneratorPluginOptions, {
    url?: string;
    additionalCapabilities?: object;
    implicitTimeout?: number;
}>;

/**
 * abstract class to be extended by any Browser Session Generator Plugins to be
 * loaded by the `BrowserSessionGeneratorManager`. accepts options of the following:
 * ```json
 * {
 *     "url": "http://url.to/selenium/grid",
 *     "uiplatform": "android_11_firefox_75_Google Pixel XL",
 *     "additionalCapabilities": {
 *         "someKey": "someValue"
 *     },
 *     "implicitTimeout": 3000
 * }
 * ```
 */
export abstract class BrowserSessionGeneratorPlugin<T extends BrowserSessionGeneratorPluginOptions> extends UiSessionGeneratorPlugin<T> {
    private _url: string;
    private _caps: object;
    private _timeout: number;

    abstract getCapabilities(options?: BrowserSessionOptions): Promise<Capabilities>;

    get url(): string {
        if (!this._url) {
            this._url = this.option('url');
        }
        return this._url;
    }
    get additionalCapabilities(): object {
        if (!this._caps) {
            this._caps = this.option('additionalCapabilities', {});
        }
        return this._caps;
    }
    get implicitTimeout(): number {
        if (!this._timeout) {
            this._timeout = this.option('implicitTimeout', 1000);
        }
        return this._timeout;
    }
    protected async createDriver(options?: BrowserSessionOptions): Promise<WebDriver> {
        if (!options?.driver) {
            try {
                const caps: Capabilities = await this.getCapabilities(options);
                const driver: WebDriver = await new Builder()
                    .usingServer(this.url)
                    .withCapabilities(caps)
                    .build();
                await driver.manage().setTimeouts({implicit: this.implicitTimeout});
                await driver.manage().window().maximize();
                return driver;
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return options?.driver;
    }
}