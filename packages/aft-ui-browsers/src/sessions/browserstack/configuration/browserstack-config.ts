import { OptionsManager } from 'aft-core';
import { nameof } from "ts-simple-nameof";

export class BrowserStackConfigOptions {
    user: string;
    key: string;
    resolution?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
    apiUrl?: string;

    _optMgr?: OptionsManager;
}

/**
 * reads configuration from either the passed in {BrowserStackConfigOptions}
 * or the `aftconfig.json` file under a heading of `browserstackconfig` like:
 * ```json
 * {
 *   "browserstackconfig": {
 *     "user": "your-username@your-company.com",
 *     "key": "your-access-key-for-browserstack",
 *     "debug": true,
 *     "local": false,
 *     "localIdentifier": "123456"
 *   }
 * }
 * ```
 */
export class BrowserStackConfig {
    private _apiUrl: string;
    private _user: string;
    private _key: string;
    private _resolution: string;
    private _debug: boolean;
    private _local: boolean;
    private _localIdentifier: string;
    
    private _optMgr: OptionsManager;

    constructor(options?: BrowserStackConfigOptions) {
        this._optMgr = options?._optMgr || new OptionsManager(nameof(BrowserStackConfig).toLowerCase(), options);
    }
    
    async apiUrl(): Promise<string> {
        if (!this._apiUrl) {
            this._apiUrl = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.apiUrl), 'https://api.browserstack.com/automate/');
        }
        return this._apiUrl;
    }

    async user(): Promise<string> {
        if (!this._user) {
            this._user = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.user));
        }
        return this._user;
    }

    async key(): Promise<string> {
        if (!this._key) {
            this._key = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.key));
        }
        return this._key;
    }

    async resolution(): Promise<string> {
        if (!this._resolution) {
            this._resolution = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.resolution));
        }
        return this._resolution;
    }

    async debug(): Promise<boolean> {
        if (this._debug === undefined) {
            this._debug = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.debug), false);
        }
        return this._debug;
    }

    async local(): Promise<boolean> {
        if (this._local === undefined) {
            this._local = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.local), false);
        }
        return this._local;
    }

    async localIdentifier(): Promise<string> {
        if (!this._localIdentifier) {
            this._localIdentifier = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.localIdentifier));
        }
        return this._localIdentifier;
    }
}

export const browserstackconfig = new BrowserStackConfig();