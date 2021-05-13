import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "./mobile-app-session";
import { Browser, remote, RemoteOptions } from "webdriverio";

export interface MobileAppCommand {
    commandType: unknown;
}

export interface MobileAppCommandResponse {
    error?: any;
}

export interface MobileAppSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {
    remoteOptions?: RemoteOptions;
}

export abstract class AbstractMobileAppSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
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
        return remOpts;
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

    abstract sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse>;
}