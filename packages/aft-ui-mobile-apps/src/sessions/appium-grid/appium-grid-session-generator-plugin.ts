import { MobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../mobile-app-session-generator-plugin";
import { TestPlatform } from "aft-ui";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";

export class AppiumGridSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin {
    constructor(options?: MobileAppSessionGeneratorPluginOptions) {
        super(options);
    }
    override async onLoad(): Promise<void> {
        /* do nothing */
    }
    override async newSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return new MobileAppSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString()),
            app: options?.app || await this.app()
        });
    }
    override async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
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
    override async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }
    override async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}