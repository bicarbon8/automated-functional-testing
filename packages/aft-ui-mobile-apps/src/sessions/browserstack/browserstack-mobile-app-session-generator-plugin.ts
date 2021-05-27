import { TestPlatform } from "aft-ui";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { BrowserStackAppAutomateApi } from "./app-automate/browserstack-app-automate-api";
import { BrowserStackConfig, BrowserStackConfigOptions } from "./configuration/browserstack-config";
import { UploadRequest } from "./app-automate/upload-request";
import { BrowserStackMobileAppSession } from "./browserstack-mobile-app-session";

export interface BrowserStackMobileAppSessionGeneratorPluginOptions extends MobileAppSessionGeneratorPluginOptions, BrowserStackConfigOptions {
    _config?: BrowserStackConfig;
    _api?: BrowserStackAppAutomateApi;
}

export class BrowserStackMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    private _cfg: BrowserStackConfig;
    private _api: BrowserStackAppAutomateApi;

    constructor(options?: BrowserStackMobileAppSessionGeneratorPluginOptions) {
        super(nameof(BrowserStackMobileAppSessionGeneratorPlugin).toLowerCase(), options);
        this._cfg = options?._config || new BrowserStackConfig(options as BrowserStackConfigOptions);
        this._api = options?._api || new BrowserStackAppAutomateApi({_config: this._cfg});
    }

    override async onLoad(): Promise<void> {
        /* do nothing */
    }

    override async newSession(options?: MobileAppSessionOptions): Promise<BrowserStackMobileAppSession> {
        return new BrowserStackMobileAppSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            platform: options?.platform || await this.getPlatform().then(p => p.toString()),
            app: options?.app || await this.app()
        });
    }

    override async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.user = remOpts.user || await this._cfg.user();
        remOpts.key = remOpts.key || await this._cfg.key();
        remOpts.capabilities = remOpts.capabilities || {};
        let platform: TestPlatform = (options?.platform) ? TestPlatform.parse(options.platform) : await this.getPlatform();
        remOpts.capabilities['os'] = remOpts.capabilities['os'] || platform.os;
        remOpts.capabilities['os_version'] = remOpts.capabilities['os_version'] || platform.osVersion;
        remOpts.capabilities['device'] = remOpts.capabilities['device'] || platform.deviceName;
        remOpts.capabilities['realMobile'] = true;
        remOpts.capabilities['browserstack.debug'] = remOpts.capabilities['browserstack.debug'] || await this._cfg.debug();
        remOpts.capabilities['build'] = remOpts.capabilities['build'] || await this._cfg.buildName();
        remOpts.capabilities['name'] = remOpts.capabilities['name'] || await options?.logMgr?.logName() || await this.logMgr.logName();
        remOpts.capabilities['browserstack.local'] = remOpts.capabilities['browserstack.local'] || await this._cfg.local();
        remOpts.capabilities['browserstack.localIdentifier'] = remOpts.capabilities['browserstack.localIdentifier'] || await this._cfg.localIdentifier();
        return remOpts;
    }

    override async sendCommand(command: string, data?: any): Promise<any> {
        let resp: any;
        try {
            switch (command) {
                case 'upload':
                    resp = await this._api.uploadApp(data as UploadRequest);
                    break;
                case 'getApps':
                    resp = await this._api.getApps();
                    break;
                default:
                    resp = { error: `unknown command of '${command}' sent to ${nameof(BrowserStackMobileAppSessionGeneratorPlugin)}.sendCommand` };
                    break;
            }
        } catch (e) {
            return Promise.reject(e);
        }
        return resp;
    }

    override async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}