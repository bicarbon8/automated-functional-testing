import { nameof } from "ts-simple-nameof";
import { OptionsManager } from "aft-core";

export interface SauceLabsConfigOptions {
    username: string;
    accessKey: string;
    tunnel?: boolean;
    tunnelId?: string;
    apiUrl?: string;

    _optMgr?: OptionsManager;
}

/**
 * reads configuration from either the passed in {SauceLabsConfigOptions}
 * or the `aftconfig.json` file under a heading of `saucelabsconfig` like:
 * ```json
 * {
 *   "saucelabsconfig": {
 *     "user": "your-username@your-company.com",
 *     "key": "your-access-key-for-sauce-labs"
 *     "tunnel": false,
 *     "tunnelId": "123456"
 *   }
 * }
 * ```
 */
export class SauceLabsConfig {
    private _apiUrl: string;
    private _username: string;
    private _accessKey: string;
    private _tunnel: boolean;
    private _tunnelId: string;
    
    private _optMgr: OptionsManager;

    constructor(options?: SauceLabsConfigOptions) {
        this._optMgr = options?._optMgr || new OptionsManager(nameof(SauceLabsConfig).toLowerCase(), options);
    }
    
    async apiUrl(): Promise<string> {
        if (!this._apiUrl) {
            this._apiUrl = await this._optMgr.getOption(nameof<SauceLabsConfigOptions>(o => o.apiUrl), 'http://saucelabs.com/rest/v1/');
        }
        return this._apiUrl;
    }

    async username(): Promise<string> {
        if (!this._username) {
            this._username = await this._optMgr.getOption(nameof<SauceLabsConfigOptions>(o => o.username));
        }
        return this._username;
    }

    async accessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this._optMgr.getOption(nameof<SauceLabsConfigOptions>(o => o.accessKey));
        }
        return this._accessKey;
    }

    async tunnel(): Promise<boolean> {
        if (this._tunnel === undefined) {
            this._tunnel = await this._optMgr.getOption(nameof<SauceLabsConfigOptions>(o => o.tunnel), false);
        }
        return this._tunnel;
    }

    async tunnelId(): Promise<string> {
        if (!this._tunnelId) {
            this._tunnelId = await this._optMgr.getOption(nameof<SauceLabsConfigOptions>(o => o.tunnelId));
        }
        return this._tunnelId;
    }
}

export const saucelabsconfig = new SauceLabsConfig();