import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";

export interface MobileAppSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions, MobileAppSessionOptions {
    
}

export abstract class AbstractMobileAppSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    private _app: string;
    
    constructor(key: string, options?: MobileAppSessionGeneratorPluginOptions) {
        super(key, options);
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await this.optionsMgr.getOption<RemoteOptions>(nameof<MobileAppSessionGeneratorPluginOptions>(o => o.remoteOptions), {} as RemoteOptions);
        if (options?.remoteOptions) {
            for (var key in options.remoteOptions) {
                remOpts[key] = options.remoteOptions[key];
            }
        }
        let app: string = options?.app || await this.app();
        if (app) {
            remOpts.capabilities = remOpts.capabilities || {};
            remOpts.capabilities['app'] = app;
        }
        return remOpts;
    }

    async app(): Promise<string> {
        if (!this._app) {
            this._app = await this.optionsMgr.getOption(nameof<MobileAppSessionGeneratorPluginOptions>(o => o.app));
        }
        return this._app;
    }

    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        if (await this.enabled()) {
            if (!options?.driver) {
                try {
                    let remOpts: RemoteOptions = await this.getRemoteOptions(options);
                    let driver: Browser<'async'> = await remote(remOpts);
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

    abstract sendCommand(command: string, data?: any): Promise<any>;
}