import { SessionGeneratorPlugin, SessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";

export interface MobileAppSessionGeneratorPluginOptions extends SessionGeneratorPluginOptions, MobileAppSessionOptions {
    
}

export abstract class MobileAppSessionGeneratorPlugin extends SessionGeneratorPlugin {
    private _app: string;
    
    constructor(options?: MobileAppSessionGeneratorPluginOptions) {
        super(options);
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await this.optionsMgr.get<RemoteOptions>('remoteOptions', {} as RemoteOptions);
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
            this._app = await this.optionsMgr.get('app');
        }
        return this._app;
    }

    abstract override newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession>;
    
    async createDriver(options?: MobileAppSessionOptions): Promise<Browser<'async'>> {
        if (!options?.driver) {
            if (await this.enabled()) {
                try {
                    let remOpts: RemoteOptions = await this.getRemoteOptions(options);
                    let driver: Browser<'async'> = await remote(remOpts);
                    return driver;
                } catch (e) {
                    return Promise.reject(e);
                }
            }
        }
        return options?.driver;
    }

    abstract sendCommand(command: string, data?: any): Promise<any>;
}