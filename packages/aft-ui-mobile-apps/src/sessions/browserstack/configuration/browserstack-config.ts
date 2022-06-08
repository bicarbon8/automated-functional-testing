import { buildinfo, cfgmgr, convert, IConfigProvider, IHasConfig, optmgr } from 'aft-core';

export type BrowserStackConfigOptions = {
    user?: string;
    key?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
    appApiUrl?: string;
    buildName?: string;
};

/**
 * reads configuration from either the passed in `BrowserStackConfigOptions`
 * or the `aftconfig.json` file under a heading of `BrowserStackConfig` like:
 * ```json
 * {
 *   "BrowserStackConfig": {
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
export class BrowserStackConfig implements IHasConfig<BrowserStackConfigOptions> {
    private readonly _config: IConfigProvider<BrowserStackConfigOptions>
    
    private _url: string;
    private _user: string;
    private _key: string;
    private _debug: boolean;
    private _local: boolean;
    private _localIdentifier: string;
    private _buildName: string;

    constructor(options?: BrowserStackConfigOptions) {
        this._config = cfgmgr.get(this.constructor.name, optmgr.process(options));
    }

    async config<K extends keyof BrowserStackConfigOptions, V extends BrowserStackConfigOptions[K]>(key: K, defaultVal?: V): Promise<V> {
        return this._config.get<K, V>(key, defaultVal);
    }
    
    async appApiUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this.config('appApiUrl', 'https://api.browserstack.com/app-automate/');
        }
        return this._url;
    }

    async user(): Promise<string> {
        if (!this._user) {
            this._user = await this.config('user');
        }
        return this._user;
    }

    async key(): Promise<string> {
        if (!this._key) {
            this._key = await this.config('key');
        }
        return this._key;
    }

    async debug(): Promise<boolean> {
        if (this._debug === undefined) {
            this._debug = await this.config('debug', false);
        }
        return this._debug;
    }

    async local(): Promise<boolean> {
        if (this._local === undefined) {
            this._local = await this.config('local', false);
        }
        return this._local;
    }

    async localIdentifier(): Promise<string> {
        if (!this._localIdentifier) {
            this._localIdentifier = await this.config('localIdentifier');
        }
        return this._localIdentifier;
    }

    async buildName(): Promise<string> {
        if (!this._buildName) {
            this._buildName = await this.config('buildName', await buildinfo.get());
        }
        return this._buildName;
    }
}

/**
 * reads configuration from either the passed in `BrowserStackConfigOptions`
 * or the `aftconfig.json` file under a heading of `BrowserStackConfig` like:
 * ```json
 * {
 *   "BrowserStackConfig": {
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
export const browserstackconfig = new BrowserStackConfig();