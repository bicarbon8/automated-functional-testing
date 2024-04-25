import * as fs from "fs";
import * as path from "path";
import { CacheMap, rand, wait } from "../../src";

describe('CacheMap', () => {
    beforeAll(() => {
        const dir: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, {recursive: true, force: true});
        }
    });
    
    it('can use an in-memory map', () => {
        const cm = new CacheMap<string, any>(1000, false);

        expect(cm).toBeDefined();
    });

    it('throws if no name provided for file system map', () => {
        expect(() => new CacheMap<any, any>(1000, true)).toThrow();
    });

    it('can use a FileSystemMap', () => {
        const name: string = rand.getString(15);
        const cm = new CacheMap<string, string>(1000, true, name);

        expect(cm).toBeDefined();
    });

    it('returns undefined if cached item has expired and is accessed', async () => {
        const name: string = rand.getString(15);
        const cm = new CacheMap<number, Record<string, number>>(10, false);

        const key = rand.getInt(50, 100);
        const val = {
            'foo': rand.getFloat(100, 1000)
        }
        cm.set(key, val);

        await wait.forDuration(100);

        const actual: Record<string, number> = cm.get(key);
        expect(actual).toBeUndefined();
    });

    it('returns false for has key if cached item has expired', async () => {
        const name: string = rand.getString(15);
        const cm = new CacheMap<number, Record<string, number>>(10, true, name);

        const key = rand.getInt(50, 100);
        const val = {
            'foo': rand.getFloat(100, 1000)
        }
        cm.set(key, val);

        await wait.forDuration(100);

        const actual: boolean = cm.has(key);
        expect(actual).toBeFalse();
    });

    it('returns value if cached item is still valid and is accessed', () => {
        const name: string = rand.getString(15);
        const cm = new CacheMap<number, Record<string, number>>(4000, true, name);

        const key = rand.getInt(50, 100);
        const val = {
            'foo': rand.getFloat(100, 1000)
        }
        cm.set(key, val);

        const actual: Record<string, number> = cm.get(key);
        expect(actual).toEqual(val);
    });

    it('returns true for has key if cached item is still valid', async () => {
        const cm = new CacheMap<number, Record<string, number>>(4000, false);

        const key = rand.getInt(50, 100);
        const val = {
            'foo': rand.getFloat(100, 1000)
        }
        cm.set(key, val);

        const actual: boolean = cm.has(key);
        expect(actual).toBeTrue();
    });

    it('will never expire data with a cacheDurationMs of Infinity', () => {
        const name: string = rand.getString(15);
        const cm = new CacheMap<number, Record<string, number>>(Infinity, true, name);

        const key = rand.getInt(50, 100);
        const val = {
            'foo': rand.getFloat(100, 1000)
        }
        cm.set(key, val);

        const actual: boolean = cm.has(key);
        expect(actual).toBeTrue();

        const actualExpiration = cm.expires(key);
        expect(actualExpiration).toEqual(Infinity);
    })
});