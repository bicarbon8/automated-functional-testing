import { WebDriver } from "selenium-webdriver";
import { Class, Merge } from "aft-core";
import { UiFacet, UiFacetOptions, UiPlatform, UiSession, UiSessionOptions } from "aft-ui";

export type BrowserSessionOptions = Merge<UiSessionOptions, {
    uiplatform?: string;
    resolution?: string;
    additionalCapabilities?: object;
    driver?: WebDriver;
}>;

export class BrowserSession<T extends BrowserSessionOptions> extends UiSession<T> {
    private _uiplatform: UiPlatform;
    private _resolution: string;
    private _additionalCapabilities: object;

    get uiplatform(): UiPlatform {
        if (!this._uiplatform) {
            const plt = this.option('uiplatform', '+_+_+_+_+');
            this._uiplatform = UiPlatform.parse(plt);
        }
        return this._uiplatform;
    }

    get resolution(): string {
        if (!this._resolution) {
            this._resolution = this.option('resolution');
        }
        return this._resolution;
    }

    get additionalCapabilities(): object {
        if (!this._additionalCapabilities) {
            this._additionalCapabilities = this.option('additionalCapabilities', {});
        }
        return this._additionalCapabilities;
    }
    
    override get driver(): WebDriver {
        return this.option('driver');
    }

    async getFacet<T extends UiFacet<To>, To extends UiFacetOptions>(facetType: Class<T>, options?: To): Promise<T> {
        options = options || {} as To;
        options.driver = options.driver || this;
        options.logMgr = options.logMgr || this.logMgr;
        const facet: T = new facetType(options);
        return facet;
    }

    async goTo(url: string): Promise<BrowserSession<any>> {
        try {
            await this.driver?.get(url);
        } catch (e) {
            return Promise.reject(e);
        }
        return this;
    }

    async refresh(): Promise<BrowserSession<any>> {
        try {
            await this.driver?.navigate().refresh();
        } catch (e) {
            return Promise.reject(e);
        }
        return this;
    }

    async resize(width: number, height: number): Promise<BrowserSession<any>> {
        try {
            await this.driver?.manage().window().setSize(width, height);
        } catch (e) {
            return Promise.reject(e);
        }
        return this;
    }

    async dispose(error?: any): Promise<void> {
        if (error) {
            await this.logMgr.warn(error);
        }
        await this.logMgr.debug(`closing driver instance...`);
        await this.driver?.quit();
        await this.logMgr.debug(`driver instance closed.`);
    }
}