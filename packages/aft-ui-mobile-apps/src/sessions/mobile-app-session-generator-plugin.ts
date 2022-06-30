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

    async generateRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        options = options || {};
        let remOpts: RemoteOptions = this.option('remoteOptions', {}) as RemoteOptions;
        if (options.remoteOptions) {
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

    abstract override newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession<any>>;
    
    async createDriver(remoteOptions: RemoteOptions): Promise<Browser<'async'>> {
        if (remoteOptions) {
            try {
                let driver: Browser<'async'> = await remote(remoteOptions);
                return driver;
            } catch (e) {
                return Promise.reject(e);
            }
        }
        return null;
    }

    abstract sendCommand(command: string, data?: any): Promise<any>;
}