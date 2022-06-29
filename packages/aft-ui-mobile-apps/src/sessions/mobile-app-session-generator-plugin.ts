import { UiSessionGeneratorPlugin, UiSessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";
import { Merge } from "aft-core";

export type MobileAppSessionGeneratorPluginOptions = Merge<UiSessionGeneratorPluginOptions, {
    remoteOptions?: object;
    app?: string;
}>;

export abstract class MobileAppSessionGeneratorPlugin<T extends MobileAppSessionGeneratorPluginOptions> extends UiSessionGeneratorPlugin<T> {
    private _app: string;

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = this.option('remoteOptions', {}) as RemoteOptions;
        if (options?.remoteOptions) {
            remOpts = {...remOpts, ...options.remoteOptions}
        }
        let app: string = options?.app || this.app;
        if (app) {
            remOpts.capabilities = remOpts.capabilities || {};
            remOpts.capabilities['app'] = app;
        }
        return remOpts;
    }

    get app(): string {
        if (!this._app) {
            this._app = this.option('app');
        }
        return this._app;
    }

    abstract override newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession>;
    
    async createDriver(options?: MobileAppSessionOptions): Promise<Browser<'async'>> {
        if (!options?.driver) {
            try {
                let remOpts: RemoteOptions = await this.getRemoteOptions(options);
                let driver: Browser<'async'> = await remote(remOpts);
                return driver;
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return options?.driver;
    }

    abstract sendCommand(command: string, data?: any): Promise<any>;
}