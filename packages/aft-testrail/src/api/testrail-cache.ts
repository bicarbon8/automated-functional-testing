import { CacheObject } from "./cache-object";
import { trconfig } from "../configuration/testrail-config";

/**
 * use `TestRailCache.instance` instead
 */
export class TestRailCache {
    private _storage: Map<string, CacheObject>;

    constructor() {
        this._storage = new Map<string, CacheObject>();
    }

    /**
     * will lookup if a passed in `key` contains any data and if said
     * data is still valid. returns the `data` if it exists
     * and is still valid, otherwise null
     * @param key the unique key under which the cached data is stored
     */
    async get<T>(key: string): Promise<T> {
        if (this._storage.has(key)) {
            let co: CacheObject = this._storage.get(key);
            if (this.isStillValid(co)) {
                return co.data as T;
            }
        }
        return null as T;
    }

    /**
     * will store the passed in `val` for a duration of 5 minutes
     * @param key the unique key under which the cached data should be stored
     * @param val the value to store
     */
    async set(key: string, val: any): Promise<void> {
        this._storage.set(key, {
            data: val,
            created: new Date(),
            validForMs: await trconfig.getCacheDuration()
        });
    }

    /**
     * clears all cached data stored in this object
     */
    clear() {
        this._storage.clear();
    }

    private isStillValid(cacheObject: CacheObject): boolean {
        if (cacheObject) {
            let created: number = cacheObject.created?.valueOf() || 0;
            let validFor: number = cacheObject.validForMs || 0;
            let validUntil: number = created + validFor;
            let now: number = new Date().valueOf();
            if (now <= validUntil) {
                return true;
            }
        }
        return false;
    }
}

export module TestRailCache {
    /**
     * a global shared instance of the `TestRailCache` class
     */
    export var instance: TestRailCache = new TestRailCache();
}