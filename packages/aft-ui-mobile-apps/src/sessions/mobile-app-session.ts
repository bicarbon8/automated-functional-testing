import { nameof } from "ts-simple-nameof";
import { Clazz, LoggingPluginManager } from "aft-core";
import { AbstractFacet, ISession, ISessionOptions, TestPlatform } from "aft-ui";
import { MobileAppFacetOptions } from "../facets/mobile-app-facet";
import { Browser } from "webdriverio";

export interface MobileAppSessionOptions extends ISessionOptions {
    driver?: Browser<'async'>;
    app?: string;
}

export class MobileAppSession implements ISession {
    readonly driver: Browser<'async'>;
    readonly platform: TestPlatform;
    readonly app: string;
    readonly logMgr: LoggingPluginManager;
    
    constructor(options: MobileAppSessionOptions) {
        this.driver = options.driver;
        this.platform = TestPlatform.parse(options.platform);
        this.app = options.app;
        this.logMgr = options.logMgr || new LoggingPluginManager({logName: `${nameof(MobileAppSession)}_${this.driver?.sessionId}`});
    }
    
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: MobileAppFacetOptions): Promise<T> {
        options = options || {};
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: T = new facetType(options);
        return facet;
    }

    async dispose(error?: Error): Promise<void> {
        if (error) {
            this.logMgr.warn(`Error: ${nameof(MobileAppSession)} - ${error.message}`);
        }
        this.logMgr.trace(`shutting down ${nameof(MobileAppSession)}: ${this.driver?.sessionId}`);
        await this.driver?.deleteSession();
    }
}