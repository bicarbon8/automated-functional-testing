import { TestPlatform } from "aft-ui";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppCommand, MobileAppCommandResponse, MobileAppSessionGeneratorPluginOptions } from "../abstract-mobile-app-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { BrowserStackAppAutomateApi, BrowserStackMobileAppSessionStatusCommand, BrowserStackMobileAppUploadCommand } from "./app-automate/browserstack-app-automate-api";
import { BrowserStackConfig, BrowserStackConfigOptions } from "./configuration/browserstack-config";

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

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
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

    async sendCommand(command: MobileAppCommand): Promise<MobileAppCommandResponse> {
        let resp: MobileAppCommandResponse;
        try {
            switch (command.commandType) {
                case 'upload':
                    resp = await this._api.uploadApp(command as BrowserStackMobileAppUploadCommand);
                    break;
                case 'setStatus': 
                    resp = await this._api.setSessionStatus(command as BrowserStackMobileAppSessionStatusCommand);
                    break;
                case 'getApps':
                    resp = await this._api.getApps();
                    break;
                default:
                    resp = { error: `unknown command of '${command.commandType}' send to ${nameof(BrowserStackMobileAppSessionGeneratorPlugin)}` };
                    break;
            }
        } catch (e) {
            return Promise.reject(e);
        }
        return resp;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}