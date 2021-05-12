import { OptionsManager } from 'aft-core';
import { nameof } from "ts-simple-nameof";
import { BuildName } from '../../../helpers/build-name';

export class BrowserStackConfigOptions {
    user?: string;
    key?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
    app?: string;
    appApiUrl?: string;
    buildName?: string;

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
 *     "app": "bs://f7c874f21852ba57957a3fdc33f47514288c4ba4",
 *     "debug": true,
 *     "local": false,
 *     "localIdentifier": "123456"
 *   }
 * }
 * ```
 */
export class BrowserStackConfig {
    private _url: string;
    private _user: string;
    private _key: string;
    private _debug: boolean;
    private _local: boolean;
    private _localIdentifier: string;
    private _app: string;
    private _buildName: string;
    
    private _optMgr: OptionsManager;

    constructor(options?: BrowserStackConfigOptions) {
        this._optMgr = options?._optMgr || new OptionsManager(nameof(BrowserStackConfig).toLowerCase(), options);
    }
    
    async appApiUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.appApiUrl), 'https://api.browserstack.com/app-automate/');
        }
        return this._url;
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

    async app(): Promise<string> {
        if (!this._app) {
            this._app = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.app));
        }
        return this._app;
    }

    async buildName(): Promise<string> {
        if (!this._buildName) {
            this._buildName = await this._optMgr.getOption(nameof<BrowserStackConfigOptions>(o => o.buildName), await BuildName.get());
        }
        return this._buildName;
    }
}

export const browserstackconfig = new BrowserStackConfig();