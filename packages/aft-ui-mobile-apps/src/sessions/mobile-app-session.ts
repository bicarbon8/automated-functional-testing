import { Class, Merge } from "aft-core";
import { UiFacet, UiSession, UiSessionOptions, UiFacetOptions } from "aft-ui";
import { Browser, RemoteOptions } from "webdriverio";

export type MobileAppSessionOptions = Merge<UiSessionOptions, {
    driver?: Browser<'async'>;
    /**
     * a path to the mobile application (.apk or .ipa).
     * NOTE: if left blank then you must specify the value in 
     * your `remoteOptions.capabilities['app']`
     */
    app?: string;
    /**
     * an object consisting of string key value pairs used to specify
     * any remote device options to be passed to the Appium grid when
     * creating a session
     */
    remoteOptions?: RemoteOptions;
}>;

export class MobileAppSession<T extends MobileAppSessionOptions> extends UiSession<T> {
    private _driver: Browser<'async'>;

    get driver(): Browser<'async'> {
        if (!this._driver) {
            this._driver = this.option('driver');
        }
        return this._driver;
    }

    async getFacet<T extends UiFacet<To>, To extends UiFacetOptions>(facetType: Class<T>, options?: To): Promise<T> {
        options = options || {} as To;
        options.driver = options.driver || this;
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