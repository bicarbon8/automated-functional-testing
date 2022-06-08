import { WebDriver } from "selenium-webdriver";
import { Class, Merge } from "aft-core";
import { UiFacet, UiFacetOptions, UiSession, UiSessionOptions } from "aft-ui";

export type BrowserSessionOptions = Merge<UiSessionOptions, {
    driver?: WebDriver;
}>;

export class BrowserSession extends UiSession<BrowserSessionOptions> {
    override get driver(): WebDriver {
        return this.option('driver');
    }

    async getFacet<T extends UiFacet<To>, To extends UiFacetOptions>(facetType: Class<T>, options?: To): Promise<T> {
        options = options || {} as To;
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        const facet: T = new facetType(options);
        return facet;
    }

    async goTo(url: string): Promise<BrowserSession> {
        try {
            await this.driver?.get(url);
        } catch (e) {
            return Promise.reject(e);
        }
        return this;
    }

    async refresh(): Promise<BrowserSession> {
        try {
            await this.driver?.navigate().refresh();
        } catch (e) {
            return Promise.reject(e);
        }
        return this;
    }

    async resize(width: number, height: number): Promise<BrowserSession> {
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