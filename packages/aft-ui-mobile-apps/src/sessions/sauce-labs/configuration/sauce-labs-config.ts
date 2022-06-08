import { cfgmgr, IConfigProvider, IHasConfig, optmgr } from "aft-core";

export type SauceLabsConfigOptions = {
    username: string;
    accessKey: string;
    tunnel?: boolean;
    tunnelId?: string;
    apiUrl?: string;
};

/**
 * reads configuration from either the passed in `SauceLabsConfigOptions`
 * or the `aftconfig.json` file under a heading of `saucelabsconfig` like:
 * ```json
 * {
 *   "SauceLabsConfig": {
 *     "user": "your-username@your-company.com",
 *     "key": "your-access-key-for-sauce-labs"
 *     "tunnel": false,
 *     "tunnelId": "123456"
 *   }
 * }
 * ```
 */
export class SauceLabsConfig implements IHasConfig<SauceLabsConfigOptions> {
    private readonly _config: IConfigProvider<SauceLabsConfigOptions>;

    private _apiUrl: string;
    private _username: string;
    private _accessKey: string;
    private _tunnel: boolean;
    private _tunnelId: string;

    constructor(options?: SauceLabsConfigOptions) {
        this._config = cfgmgr.get(this.constructor.name, optmgr.process(options));
    }
    
    config<K extends keyof SauceLabsConfigOptions, V extends SauceLabsConfigOptions[K]>(key: K, defaultVal?: V): Promise<V> {
        return this._config.get<K, V>(key, defaultVal);
    }
    
    async apiUrl(): Promise<string> {
        if (!this._apiUrl) {
            this._apiUrl = await this.config('apiUrl', 'http://saucelabs.com/rest/v1/');
        }
        return this._apiUrl;
    }

    async username(): Promise<string> {
        if (!this._username) {
            this._username = await this.config('username');
        }
        return this._username;
    }

    async accessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this.config('accessKey');
        }
        return this._accessKey;
    }

    async tunnel(): Promise<boolean> {
        if (this._tunnel === undefined) {
            this._tunnel = await this.config('tunnel', false);
        }
        return this._tunnel;
    }

    async tunnelId(): Promise<string> {
        if (!this._tunnelId) {
            this._tunnelId = await this.config('tunnelId');
        }
        return this._tunnelId;
    }
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
export const saucelabsconfig = new SauceLabsConfig();
