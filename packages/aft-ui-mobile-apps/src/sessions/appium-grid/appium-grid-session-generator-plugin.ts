import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { TestPlatform } from "aft-ui";
import { nameof } from "ts-simple-nameof";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export class AppiumGridSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    constructor(options?: MobileAppSessionGeneratorPluginOptions) {
        super(nameof(AppiumGridSessionGeneratorPlugin).toLowerCase(), options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return new MobileAppSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString()),
            app: options?.app || await this.app()
        });
    }
    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = {};
        let platform: TestPlatform = (options?.platform) ? TestPlatform.parse(options.platform) : await this.getPlatform();
        let osVersion = '';
        if (platform.osVersion) {
            osVersion = ' ' + platform.osVersion;
        }
        remOpts.capabilities['platform'] = `${platform.os}${osVersion}`;
        return remOpts;
    }
    async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}