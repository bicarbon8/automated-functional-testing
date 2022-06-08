import { cfgmgr, IConfigProvider, FileSystemMap, IHasConfig, optmgr } from 'aft-core';

export type TestRailConfigOptions = {
    url?: string;
    user?: string;
    accesskey?: string;
    projectid?: number;
    suiteids?: number[];
    planid?: number;
    cacheDurationMs?: number;
}

/**
 * reads configuration from either the passed in `TestRailConfigOptions`
 * or the `aftconfig.json` file under a heading of `testrailconfig` like:
 * ```json
 * {
 *   "TestRailConfig": {
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
 * - `projectid` and `suiteids` are only used if no `planid` is specified
 * - if 'TestRailLoggingPlugin` is in use and no `planid` is specified a new
 * TestRail plan will be created and the value stored in a shared file for access
 * by other processes and subsequent test executions
 */
export class TestRailConfig implements IHasConfig<TestRailConfigOptions> {
    private _url: string;
    private _user: string;
    private _accessKey: string;
    private _projectId: number;
    private _suiteIds: number[];
    private _planId: number;
    private _cacheDuration: number;
    
    private readonly _shared: FileSystemMap<string, number>;

    private readonly _config: IConfigProvider<TestRailConfigOptions>;

    constructor(options?: TestRailConfigOptions) {
        options = options || {} as TestRailConfigOptions;
        this._config = cfgmgr.get<TestRailConfigOptions>(this.constructor.name, optmgr.process(options));
        this._shared = new FileSystemMap<string, number>(this.constructor.name);
    }
    
    config<K extends keyof TestRailConfigOptions, V extends TestRailConfigOptions[K]>(key: K, defaultVal?: V): Promise<V> {
        return this._config.get(key, defaultVal);
    }
    
    async url(): Promise<string> {
        if (!this._url) {
            this._url = await this.config('url');
        }
        return this._url;
    }

    async user(): Promise<string> {
        if (!this._user) {
            this._user = await this.config('user');
        }
        return this._user;
    }

    async accessKey(): Promise<string> {
        if (!this._accessKey) {
            this._accessKey = await this.config('accesskey');
        }
        return this._accessKey;
    }

    async projectId(): Promise<number> {
        if (this._projectId === undefined) {
            this._projectId = await this.config('projectid', -1);
        }
        return this._projectId;
    }

    async suiteIds(): Promise<number[]> {
        if (this._suiteIds === undefined) {
            this._suiteIds = await this.config('suiteids', []);
        }
        return this._suiteIds;
    }

    async planId(): Promise<number> {
        if (this._planId === undefined) {
            this._planId = this._shared.get('planid') || await this.config('planid', -1);
        }
        return this._planId;
    }

    setPlanId(id: number): this {
        this._shared.set('planid', id);
        this._planId = id;
        return this;
    }

    async cacheDuration(): Promise<number> {
        if (this._cacheDuration === undefined) {
            this._cacheDuration = await this.config('cacheDurationMs', 300000);
        }
        return this._cacheDuration;
    }
}

export const trconfig = new TestRailConfig();