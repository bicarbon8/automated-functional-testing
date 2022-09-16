import { WebDriver, Builder, Capabilities } from "selenium-webdriver";
import { UiSessionGeneratorPlugin, UiSessionGeneratorPluginOptions } from "aft-ui";
import { BrowserSessionOptions } from "./browser-session";
import { Err, Merge } from "aft-core";

export type BrowserSessionGeneratorPluginOptions = Merge<UiSessionGeneratorPluginOptions, {
    url?: string;
    resolution?: string;
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
    private _resolution: string;
    private _caps: object;
    private _timeout: number;

    get url(): string {
        if (!this._url) {
            this._url = this.option('url');
        }
        return this._url;
    }
    get resolution(): string {
        if (!this._resolution) {
            this._resolution = this.option('resolution');
        }
        return this._resolution;
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

    abstract generateCapabilities(options?: BrowserSessionOptions): Promise<Capabilities>;
    
    /**
     * expected to be called from within `BrowserSessionGeneratorPlugin` implementations
     * after configuring their own `Capabilties` within their `newUiSession` function
     * @param capabilities capabilities to pass to the Remote WebDriver Builder
     * @returns a new `WebDriver` instance
     */
    protected async createDriver(capabilities: Capabilities): Promise<WebDriver> {
        if (capabilities) {
            try {
                const driver: WebDriver = await new Builder()
                    .usingServer(this.url)
                    .withCapabilities(capabilities)
                    .build();
                await Err.handle(() => driver.manage().setTimeouts({implicit: this.implicitTimeout}), {
                    logMgr: this.logMgr,
                    errLevel: 'debug'
                });
                await Err.handle(() => driver.manage().window().maximize(), {
                    logMgr: this.logMgr,
                    errLevel: 'debug'
                });
                return driver;
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return null;
    }
}