import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";

export interface MobileAppGridSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {
    remoteOptions?: RemoteOptions;
}

export abstract class AbstractMobileAppGridSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    private _remoteOpts: RemoteOptions;

    constructor(key: string, options?: MobileAppGridSessionGeneratorPluginOptions) {
        super(key, options);
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        if (!this._remoteOpts) {
            this._remoteOpts = await this.optionsMgr.getOption<RemoteOptions>(nameof<MobileAppGridSessionGeneratorPluginOptions>(o => o.remoteOptions), {} as RemoteOptions);
        }
        return this._remoteOpts;
    }

    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        if (await this.enabled()) {
            if (!options?.driver) {
                try {
                    let remOpts: RemoteOptions = await this.getRemoteOptions(options);
                    let driver: Browser<'async'> = await remote(remOpts);
                    await driver.setTimeout({implicit: 1000});
                    return new MobileAppSession({
                        driver: driver,
                        logMgr: options?.logMgr || this.logMgr
                    });
                } catch (e) {
                    return Promise.reject(e);
                }
            }
            return new MobileAppSession({driver: options.driver, logMgr: options.logMgr || this.logMgr});
        }
        return null;
    }
}