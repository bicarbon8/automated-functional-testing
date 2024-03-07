import * as path from "path";
import { convert } from "./convert";
import { JsonKey, JsonValue } from "./custom-types";
import { ExpiringFileLock } from "./expiring-file-lock";
import { fileio } from "./file-io";
import { AftConfig, aftConfig } from "../configuration/aft-config";

/**
 * an implementation of `Map` that stores all its data on the filesystem allowing
 * the data to be shared among multiple running node processes or to persist for
 * multiple runs of a script
 * @param filename the filesystem name to store data within. this will be combined
 * with the current working directory and a subdirectory of `FileSystemMap` and have
 * the extension .json appended to it
 * @param entries an optional array of arrays containing two elements used to seed 
 * the instantiated map object
 * @param aftCfg an optional `AftConfig` instance that allows you to override any
 * `FileSystemMapConfig` loaded from `appsettings.json`
 */
export class FileSystemMap<Tkey extends JsonKey, Tval extends JsonValue> implements Map<Tkey, Tval>
{
    public readonly filename: string;

    private readonly _memoryMap: Map<Tkey, Tval>;
    private readonly _aftCfg: AftConfig;

    constructor(filename: string, entries?: readonly (readonly [Tkey, Tval])[] | null, aftCfg?: AftConfig) {
        if (!filename) {
            throw `[${this.constructor.name}] filename argument must be defined'`;
        }
        this._aftCfg = aftCfg ?? aftConfig;
        this._memoryMap = new Map<Tkey, Tval>();
        const dir = this._aftCfg.fsMapDirectory;
        this.filename = path.join(process.cwd(), dir, `${convert.toSafeString(filename)}.json`);
        this._updateMemoryMap();
        if (entries?.length > 0) {
            for (var i=0; i<entries.length; i++) {
                let entry: readonly [Tkey, Tval] = entries[i];
                this._memoryMap.set(entry?.[0], entry?.[1]);
            }
            this._writeToFile();
        }
    }

    clear(): void {
        this._memoryMap.clear();
        this._writeToFile();
    }
    delete(key: Tkey): boolean {
        this._updateMemoryMap();
        const result: boolean = this._memoryMap.delete(key);
        this._writeToFile();
        return result;
    }
    forEach(callbackfn: (value: Tval, key: Tkey, map: Map<Tkey, Tval>) => void, thisArg?: any): void {
        this._updateMemoryMap();
        this._memoryMap.forEach(callbackfn, thisArg);
        this._writeToFile();
    }
    get(key: Tkey): Tval {
        this._updateMemoryMap();
        return this._memoryMap.get(key);
    }
    has(key: Tkey): boolean {
        this._updateMemoryMap();
        return this._memoryMap.has(key);
    }
    set(key: Tkey, value: Tval): this {
        this._updateMemoryMap();
        this._memoryMap.set(key, value);
        this._writeToFile();
        return this;
    }
    get size(): number {
        this._updateMemoryMap();
        return this._memoryMap.size;
    }
    entries(): IterableIterator<[Tkey, Tval]> {
        this._updateMemoryMap();
        return this._memoryMap.entries();
    }
    keys(): IterableIterator<Tkey> {
        this._updateMemoryMap();
        return this._memoryMap.keys();
    }
    values(): IterableIterator<Tval> {
        this._updateMemoryMap();
        return this._memoryMap.values();
    }
    [Symbol.iterator](): IterableIterator<[Tkey, Tval]> {
        this._updateMemoryMap();
        return this._memoryMap[Symbol.iterator]();
    }
    get [Symbol.toStringTag](): string {
        this._updateMemoryMap();
        return this._memoryMap[Symbol.toStringTag];
    }

    private _writeToFile(): void {
        const lock: ExpiringFileLock = new ExpiringFileLock(this.filename, this._aftCfg);
        try {
            fileio.write(this.filename, convert.mapToString(this._memoryMap));
        } finally {
            lock?.unlock();
        }
    }

    private _updateMemoryMap(): void {
        let fileMapData: Map<Tkey, Tval>;
        const lock: ExpiringFileLock = new ExpiringFileLock(this.filename, this._aftCfg);
        try {
            fileMapData = fileio.readAs<Map<Tkey, Tval>>(this.filename, convert.stringToMap);
        } catch (e) {
            /* ignore error */
        } finally {
            lock?.unlock();
        }
        if (fileMapData) {
            fileMapData.forEach((val: Tval, key: Tkey) => {
                this._memoryMap.set(key, fileMapData.get(key) as Tval);
            });
        }
    }
}
