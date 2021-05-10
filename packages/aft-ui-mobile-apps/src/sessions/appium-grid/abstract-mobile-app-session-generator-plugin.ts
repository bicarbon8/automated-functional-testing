import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";
import { MobileAppCommand, MobileAppCommandResponse } from "../mobile-app-command";

export interface MobileAppSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {
    remoteOptions?: RemoteOptions;
}

export abstract class AbstractMobileAppSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    private _remoteOpts: RemoteOptions;

    constructor(key: string, options?: MobileAppSessionGeneratorPluginOptions) {
        super(key, options);
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        if (!this._remoteOpts) {
            this._remoteOpts = await this.optionsMgr.getOption<RemoteOptions>(nameof<MobileAppSessionGeneratorPluginOptions>(o => o.remoteOptions), {} as RemoteOptions);
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

    abstract sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse>;
}