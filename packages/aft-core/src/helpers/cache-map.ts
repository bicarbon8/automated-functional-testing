import { JsonKey, JsonValue, CacheObject } from "./custom-types";
import { FileSystemMap } from "./file-system-map";

/**
 * an implementation of `Map` that stores values for a maximum duration in milliseconds
 * before they expire. can optionally store either in memory (default) or on the
 * filesystem (using a `FileSystemMap`) so other instances in other running node processes
 * can use the same cache data.
 * @param cacheDurationMs the amount of time in milliseconds that stored values remain valid
 * @param useFileCache if true values will be stored on the filesystem which can be shared
 * between multiple running node processes (sharded parallel testing for example); otherwise
 * values are stored in memory only
 * @param filename the name of the file to pass to the `FileSystemMap` used to store values
 * on the filesystem if `useFileCache` is true
 */
export class CacheMap<K extends JsonKey, V extends JsonValue> implements Map<K, V> {
    private readonly _internalMap: Map<K, CacheObject> | FileSystemMap<K, CacheObject>;
    private readonly _cacheDuration: number;

    constructor(cacheDurationMs: number, useFileCache: boolean, filename?: string) {
        this._cacheDuration = cacheDurationMs;
        if (useFileCache && !filename) {
            throw `when 'useFileCache' is set to 'true', 'filename' must be defined`
        }
        this._internalMap = (useFileCache) ? new FileSystemMap<K, CacheObject>(filename) : new Map<K, CacheObject>();
    }
    
    clear(): void {
        this._internalMap.clear();
    }
    delete(key: K): boolean {
        return this._internalMap.delete(key);
    }
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any): void {
        const valMap: Map<K, V> = new Map<K, V>();
        const keys: K[] = Array.from(this._internalMap.keys());
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let val = this.get(key);
            valMap.set(key, val);
        }
        valMap.forEach(callbackfn, thisArg);
    }
    get(key: K): V {
        const cache: CacheObject = this._internalMap.get(key);
        if (this._isStillValid(cache)) {
            return cache.data as V;
        } else {
            this.delete(key);
            return this._internalMap.get(key)?.data as V;
        }
    }
    has(key: K): boolean {
        const cache: CacheObject = this._internalMap.get(key);
        if (this._isStillValid(cache)) {
            return true;
        } else {
            this.delete(key);
            return false;
        }
    }
    set(key: K, value: V): this {
        const cache: CacheObject = {
            validUntil: Date.now() + this._cacheDuration,
            data: value
        };
        this._internalMap.set(key, cache);
        return this;
    }
    get size(): number {
        return this._internalMap.size;
    }
    entries(): IterableIterator<[K, V]> {
        const entriesMap: Map<K, V> = new Map<K, V>();
        const keys: K[] = Array.from(this._internalMap.keys());
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let val = this.get(key);
            entriesMap.set(key, val);
        }
        return entriesMap.entries();
    }
    keys(): IterableIterator<K> {
        return this._internalMap.keys();
    }
    values(): IterableIterator<V> {
        let values: V[] = [];
        const keys: K[] = Array.from(this._internalMap.keys());
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let val = this.get(key);
            values.push(val);
        }
        return values.values();
    }
    [Symbol.iterator](): IterableIterator<[K, V]> {
        const entriesMap: Map<K, V> = new Map<K, V>();
        const keys: K[] = Array.from(this._internalMap.keys());
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let val = this.get(key);
            entriesMap.set(key, val);
        }
        return entriesMap[Symbol.iterator]();
    }
    get [Symbol.toStringTag](): string {
        const entriesMap: Map<K, V> = new Map<K, V>();
        const keys: K[] = Array.from(this._internalMap.keys());
        for (var i=0; i<keys.length; i++) {
            let key = keys[i];
            let val = this.get(key);
            entriesMap.set(key, val);
        }
        return entriesMap[Symbol.toStringTag];
    }

    private _isStillValid(cacheObject: CacheObject): boolean {
        if (cacheObject) {
            let validUntil: number = cacheObject.validUntil || 0;
            let now: number = Date.now();
            if (now <= validUntil) {
                return true;
            }
        }
        return false;
    }
}