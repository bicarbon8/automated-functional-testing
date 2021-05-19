import { TestPlatform } from "aft-ui";
import { BuildName } from "../../helpers/build-name";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { SauceLabsMobileAppSession } from "./sauce-labs-mobile-app-session";
import { SauceLabsConfig, SauceLabsConfigOptions } from "./configuration/sauce-labs-config";

export interface SauceLabsMobileAppSessionGeneratorPluginOptions extends MobileAppSessionGeneratorPluginOptions, Partial<SauceLabsConfigOptions> {
    _config?: SauceLabsConfig;
}

export class SauceLabsMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    private _cfg: SauceLabsConfig;

    constructor(options?: SauceLabsMobileAppSessionGeneratorPluginOptions) {
        super(nameof(SauceLabsMobileAppSessionGeneratorPlugin).toLowerCase(), options);
        this._cfg = options?._config || new SauceLabsConfig(options as SauceLabsConfigOptions);
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async newSession(options?: MobileAppSessionOptions): Promise<SauceLabsMobileAppSession> {
        return new SauceLabsMobileAppSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString()),
            app: options?.app || await this.app()
        });
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.capabilities = remOpts.capabilities || {};
        let platform: TestPlatform = (options?.platform) ? TestPlatform.parse(options.platform) : await this.getPlatform();
        remOpts.capabilities['platformName'] = remOpts.capabilities['platformName'] || platform.os;
        remOpts.capabilities['platformVersion'] = remOpts.capabilities['platformVersion'] || platform.osVersion;
        remOpts.capabilities['deviceName'] = remOpts.capabilities['deviceName'] || platform.deviceName;
        remOpts.user = remOpts.user || await this._cfg.username();
        remOpts.key = remOpts.key || await this._cfg.accessKey();
        remOpts.capabilities['buildName'] = remOpts.capabilities['buildName'] || await BuildName.get();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || await options?.logMgr?.logName() || await this.logMgr.logName();
        remOpts.capabilities['tunnelIdentifier'] = remOpts.capabilities['tunnelIdentifier'] || await this._cfg.tunnelId();
        remOpts.capabilities['automationName'] = remOpts.capabilities['automationName'] || 'Appium';
        return remOpts;
    }

    async sendCommand(command: string, data?: any): Promise<any> {
        return Promise.reject(`command '${command}' not supported`);
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}