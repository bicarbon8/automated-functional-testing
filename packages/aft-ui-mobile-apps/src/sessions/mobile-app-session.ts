import { nameof } from "ts-simple-nameof";
import { Clazz, LoggingPluginManager } from "aft-core";
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
    readonly logMgr: LoggingPluginManager;
    
    constructor(options: MobileAppSessionOptions) {
        this.driver = options.driver;
        this.app = options.app;
        this.platform = TestPlatform.parse(options.platform);
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
            await this.logMgr.warn(`Error: ${nameof(MobileAppSession)} - ${error.message}`);
        }
        await this.logMgr.trace(`shutting down ${nameof(MobileAppSession)}: ${this.driver?.sessionId}`);
        await this.driver?.deleteSession();
    }
}