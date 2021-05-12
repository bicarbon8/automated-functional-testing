import { nameof } from "ts-simple-nameof";
import { WebDriver } from "selenium-webdriver";
import { Clazz, LoggingPluginManager } from "aft-core";
import { AbstractFacet, ISession, ISessionOptions, TestPlatform } from "aft-ui";
import { BrowserFacetOptions } from "../facets/browser-facet";

export interface BrowserSessionOptions extends ISessionOptions {
    driver?: WebDriver;
}

export class BrowserSession implements ISession {
    readonly driver: WebDriver;
    readonly platform: TestPlatform;
    readonly logMgr: LoggingPluginManager;
    
    constructor(options: BrowserSessionOptions) {
        this.driver = options.driver;
        this.platform = TestPlatform.parse(options.platform);
        this.logMgr = options.logMgr || new LoggingPluginManager({logName: `${nameof(BrowserSession)}_${this.driver?.getSession().then(s => s.getId())}`});
    }
    
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: BrowserFacetOptions): Promise<T> {
        options = options || {};
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: T = new facetType(options);
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

    async dispose(error?: Error): Promise<void> {
        if (error) {
            this.logMgr.warn(`Error: ${nameof(BrowserSession)} - ${error.message}`);
        }
        this.logMgr.trace(`shutting down ${nameof(BrowserSession)}: ${await this.driver?.getSession().then(s => s.getId())}`);
        await this.driver?.quit();
    }
}