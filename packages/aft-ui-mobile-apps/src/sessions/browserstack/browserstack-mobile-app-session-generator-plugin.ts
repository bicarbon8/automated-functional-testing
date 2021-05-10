import { TestPlatform } from "aft-ui";
import { AbstractMobileAppSessionGeneratorPlugin, MobileAppSessionGeneratorPluginOptions } from "../appium-grid/abstract-mobile-app-session-generator-plugin";
import { BuildName } from "../../helpers/build-name";
import { nameof } from "ts-simple-nameof";
import { MobileAppSessionOptions } from "../mobile-app-session";
import { RemoteOptions } from "webdriverio";
import { MobileAppCommandResponse } from "../mobile-app-command";
import { BrowserStackMobileAppCommand } from "./browserstack-mobile-app-command";
import { BrowserStackAppAutomateApi, UploadAppResponse } from "./app-automate/browserstack-app-automate-api";

export interface BrowserStackMobileAppSessionGeneratorPluginOptions extends MobileAppSessionGeneratorPluginOptions {
    user: string;
    key: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
    apiUrl?: string;

    _api?: BrowserStackAppAutomateApi;
}

export class BrowserStackMobileAppSessionGeneratorPlugin extends AbstractMobileAppSessionGeneratorPlugin {
    private _api: BrowserStackAppAutomateApi;

    constructor(options?: BrowserStackMobileAppSessionGeneratorPluginOptions) {
        super(nameof(BrowserStackMobileAppSessionGeneratorPlugin).toLowerCase(), options);
        this._api = options?._api || BrowserStackAppAutomateApi.instance();
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
        remOpts.capabilities['browserstack.user'] = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.user));
        remOpts.capabilities['browserstack.key'] = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.key));
        remOpts.capabilities['browserstack.debug'] = await this.optionsMgr.getOption<boolean>(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.debug));
        remOpts.capabilities['build'] = await BuildName.get();
        remOpts.capabilities['name'] = await options?.logMgr?.logName() || await this.logMgr.logName();
        let local: boolean = await this.optionsMgr.getOption<boolean>(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.local), false);
        if (local) {
            remOpts.capabilities['browserstack.local'] = true;
            let localId: string = await this.optionsMgr.getOption(nameof<BrowserStackMobileAppSessionGeneratorPluginOptions>(o => o.localIdentifier));
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
                let bsResponse: UploadAppResponse = await this._api.uploadApp(command.data, command.customId);
                resp.data = bsResponse;
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