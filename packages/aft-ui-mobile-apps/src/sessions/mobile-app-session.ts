import { Clazz, LogManager, rand } from "aft-core";
import { AbstractFacet, ISession, ISessionOptions, TestPlatform } from "aft-ui";
import { MobileAppFacetOptions } from "../facets/mobile-app-facet";
import { Browser, RemoteOptions } from "webdriverio";

export interface MobileAppSessionOptions extends ISessionOptions {
    driver?: Browser<'async'>;
    /**
     * a path to the mobile application (.apk or .ipa).
     * NOTE: if left blank then you must specify the value in 
     * your {remoteOptions.capabilities['app']}
     */
    app?: string;
    remoteOptions?: RemoteOptions;
}

export class MobileAppSession implements ISession {
    readonly driver: Browser<'async'>;
    readonly app: string;
    readonly platform: TestPlatform;
    readonly logMgr: LogManager;
    
    constructor(options: MobileAppSessionOptions) {
        this.driver = options.driver;
        this.app = options.app;
        this.platform = TestPlatform.parse(options.platform);
        this.logMgr = options.logMgr || new LogManager({logName: `${this.constructor.name}_${rand.guid}`});
    }
    
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: MobileAppFacetOptions): Promise<T> {
        options = options || {};
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: T = new facetType(options);
        return facet;
    }
    
    async dispose(error?: any): Promise<void> {
        if (error) {
            await this.logMgr.warn(`Error: ${this.constructor.name} - ${error}`);
        }
        await this.logMgr.trace(`shutting down ${this.constructor.name}`);
        await this.driver?.deleteSession();
    }
}