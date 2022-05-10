import { OptionsManager } from 'aft-core';

export class TestRailConfigOptions {
    url: string;
    user: string;
    accesskey: string;
    projectid?: number;
    suiteids?: number[];
    planid?: number;
    cacheDurationMs?: number;

    _optMgr?: OptionsManager;
}

/**
 * reads configuration from either the passed in {TestRailConfigOptions}
 * or the `aftconfig.json` file under a heading of `testrailconfig` like:
 * ```json
 * {
 *   "testrailconfig": {
 *     "url": "https://your-instance-of.testrail.io",
 *     "user": "your-username@your-company.com",
 *     "accesskey": "your-access-key-for-testrail",
 *     "projectid": 123,
 *     "suiteids": [234, 345, 456],
 *     "planid": 123456
 *   }
 * }
 * ```
 * NOTE:
 * `projectid` and `suiteids` are used if no `planid` is specified
 */
export class TestRailConfig {
    private _url: string;
    private _user: string;
    private _accessKey: string;
    private _projectId: number;
    private _suiteIds: number[];
    private _planId: number;
    private _cacheDuration: number;
    
    private _optMgr: OptionsManager;

    constructor(options?: TestRailConfigOptions) {
        this._optMgr = options?._optMgr || new OptionsManager(this.constructor.name.toLowerCase(), options);
    }
    
    async getUrl(): Promise<string> {
        if (!this._url) {
            this._url = await this._optMgr.get('url');
        }
        return this._url;
    }

    async getUser(): Promise<string> {
        if (!this._user) {
            this._user = await this._optMgr.get('user');
        }
        return this._user;
    }

    async getAccessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this._optMgr.get('accesskey');
        }
        return this._accessKey;
    }

    async getProjectId(): Promise<number> {
        if (this._projectId === undefined) {
            this._projectId = await this._optMgr.get('projectid', -1);
        }
        return this._projectId;
    }

    async getSuiteIds(): Promise<number[]> {
        if (this._suiteIds === undefined) {
            this._suiteIds = await this._optMgr.get('suiteids', []);
        }
        return this._suiteIds;
    }

    async getPlanId(): Promise<number> {
        if (this._planId === undefined) {
            this._planId = await this._optMgr.get('planid', -1);
        }
        return this._planId;
    }

    async getCacheDuration(): Promise<number> {
        if (this._cacheDuration === undefined) {
            this._cacheDuration = await this._optMgr.get('cacheDurationMs', 300000);
        }
        return this._cacheDuration;
    }

    async setPlanId(id: number): Promise<void> {
        this._planId = id;
    }
}

export const trconfig = new TestRailConfig();