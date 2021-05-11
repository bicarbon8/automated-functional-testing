import { TestPlatform } from "aft-ui";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../appium-grid/abstract-mobile-app-session-generator-plugin";
import { BuildName } from "../../helpers/build-name";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { MobileAppCommandResponse } from "../mobile-app-command";
import { BrowserStackMobileAppCommand, BrowserStackMobileAppNetworkData, BrowserStackMobileAppUploadData } from "./browserstack-mobile-app-command";
import { BrowserStackAppAutomateApi, UploadAppResponse } from "./app-automate/browserstack-app-automate-api";
import { browserstackconfig, BrowserStackConfig } from "./configuration/browserstack-config";

export interface BrowserStackMobileAppSessionGeneratorPluginOptions extends MobileAppSessionGeneratorPluginOptions {
    _config?: BrowserStackConfig;
    _api?: BrowserStackAppAutomateApi;
}

export class BrowserStackMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    private _cfg: BrowserStackConfig;
    private _api: BrowserStackAppAutomateApi;

    constructor(options?: BrowserStackMobileAppSessionGeneratorPluginOptions) {
        super(nameof(BrowserStackMobileAppSessionGeneratorPlugin).toLowerCase(), options);
        this._cfg = options?._config || browserstackconfig;
        this._api = options?._api || new BrowserStackAppAutomateApi({_config: this._cfg});
    }

    async onLoad(): Promise<void> {
        /* do nothing */
    }

    async getRemoteOptions(options?: MobileAppSessionOptions): Promise<RemoteOptions> {
        let remOpts: RemoteOptions = await super.getRemoteOptions(options);
        remOpts.protocol = 'https';
        remOpts.hostname = 'hub-cloud.browserstack.com';
        remOpts.path = '/wd/hub';
        remOpts.capabilities = {};
        let platform: TestPlatform = await this.getPlatform()
        if (platform.browser) {
            remOpts.capabilities['browserName'] = platform.browser;
        }
        if (platform.browserVersion) {
            remOpts.capabilities['browser_version'] = platform.browserVersion;
        }
        if (platform.os) {
            remOpts.capabilities['os'] = platform.os;
        }
        if (platform.osVersion) {
            remOpts.capabilities['os_version'] = platform.osVersion;
        }
        if (platform.deviceName) {
            remOpts.capabilities['device'] = platform.deviceName;
            remOpts.capabilities['realMobile'] = true;
        }
        remOpts.capabilities['browserstack.user'] = await this._cfg.user();
        remOpts.capabilities['browserstack.key'] = await this._cfg.key();
        remOpts.capabilities['browserstack.debug'] = await this._cfg.debug();
        remOpts.capabilities['build'] = await BuildName.get();
        remOpts.capabilities['name'] = await options?.logMgr?.logName() || await this.logMgr.logName();
        let local: boolean = await this._cfg.local();
        if (local) {
            remOpts.capabilities['browserstack.local'] = true;
            let localId: string = await this._cfg.localIdentifier();
            if (localId) {
                remOpts.capabilities['browserstack.localIdentifier'] = localId;
            }
        }
        return remOpts;
    }

    async sendCommand(command: BrowserStackMobileAppCommand): Promise<MobileAppCommandResponse> {
        let resp: MobileAppCommandResponse = command;
        switch(command.name) {
            case 'upload':
                let upData: BrowserStackMobileAppUploadData = command.data as BrowserStackMobileAppUploadData;
                let bsResponse: UploadAppResponse = await this._api.uploadApp(upData.file, upData.customId);
                resp.data = bsResponse;
                break;
            case 'networkProfile':
                let netData: BrowserStackMobileAppNetworkData = command.data as BrowserStackMobileAppNetworkData;
                
                break;
            default:
                resp.error = `unknown command of '${command.name}' send to ${nameof(BrowserStackMobileAppSessionGeneratorPlugin)}`;
                break;
        }
        return resp;
    }

    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}