import { OptionsManager } from "aft-core";

export interface SauceLabsConfigOptions {
    username: string;
    accessKey: string;
    resolution?: string;
    tunnel?: boolean;
    tunnelId?: string;

    _optMgr?: OptionsManager;
}

/**
 * reads configuration from either the passed in `SauceLabsConfigOptions`
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
    private _username: string;
    private _accessKey: string;
    private _resolution: string;
    private _tunnel: boolean;
    private _tunnelId: string;
    
    private _optMgr: OptionsManager;

    constructor(options?: SauceLabsConfigOptions) {
        this._optMgr = options?._optMgr || new OptionsManager(this.constructor.name.toLowerCase(), options);
    }

    async username(): Promise<string> {
        if (!this._username) {
            this._username = await this._optMgr.get('username');
        }
        return this._username;
    }

    async accessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this._optMgr.get('accessKey');
        }
        return this._accessKey;
    }

    async resolution(): Promise<string> {
        if (!this._resolution) {
            this._resolution = await this._optMgr.get('resolution');
        }
        return this._resolution;
    }

    async tunnel(): Promise<boolean> {
        if (this._tunnel === undefined) {
            this._tunnel = await this._optMgr.get('tunnel', false);
        }
        return this._tunnel;
    }

    async tunnelId(): Promise<string> {
        if (!this._tunnelId) {
            this._tunnelId = await this._optMgr.get('tunnelId');
        }
        return this._tunnelId;
    }
}

export const saucelabsconfig = new SauceLabsConfig();