import { ChildProcess, spawn } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { convert, fileio, FileSystemMap, rand, wait } from "../../src";

const children: ChildProcess[] = [];

describe('FileSystemMap', () => {
    beforeAll(() => {
        const dir: string = path.join(process.cwd(), 'FileSystemMap');
        if (fs.existsSync(dir)) {
            fs.rmSync(dir, {recursive: true, force: true});
        }
    });

    it('throws if filename argument is undefined or null', () => {
        expect(() => new FileSystemMap(null)).toThrow();

        expect(() => new FileSystemMap(undefined)).toThrow();
    });

    it('only creates a file when data is set in the map', () => {
        const filename = rand.getString(17);
        const fm = new FileSystemMap<string, string>(filename);

        expect(fs.existsSync(path.join(process.cwd(), 'FileSystemMap', `${filename}.json`))).toBeFalse();

        fm.set(rand.getString(5), rand.getString(200, true, true, true, true));

        expect(fs.existsSync(path.join(process.cwd(), 'FileSystemMap', `${filename}.json`))).toBeTrue();
    });

    it('will read in pre-existing data from file', () => {
        const filename: string = rand.getString(15);
        const memory = new Map<string, string>();
        for (var i=0; i<5; i++) {
            let key = rand.getString(rand.getInt(10, 20));
            let val = rand.getString(rand.getInt(10, 20));
            memory.set(key, val);
        }
        const file: string = path.join(process.cwd(), 'FileSystemMap', `${filename}.json`);
        try {
            fileio.write(file, convert.mapToString(memory));
            expect(fs.existsSync(file)).withContext('file should exist after writing').toBeTrue();
            
            const fm = new FileSystemMap<string, string>(filename);
            memory.forEach((expected: string, key: string) => {
                let actual = fm.get(key);
                expect(actual).toEqual(expected);
            });
        } finally {
            fs.unlinkSync(file);
        }
    });

    it('will read in pre-existing data from file and combine with entries passed on the constructor', () => {
        const filename: string = rand.getString(15);
        const memory = new Map<string, string>();
        for (var i=0; i<5; i++) {
            let key = rand.getString(rand.getInt(10, 20));
            let val = rand.getString(rand.getInt(10, 20));
            memory.set(key, val);
        }
        const file: string = path.join(process.cwd(), 'FileSystemMap', `${filename}.json`);
        try {
            fileio.write(file, convert.mapToString(memory));
            expect(fs.existsSync(file)).withContext('file should exist after writing').toBeTrue();
            
            const fm = new FileSystemMap<string, string>(filename, [
                ["foo", "foo-val"],
                ["bar", "bar-val"]
            ]);
            memory.forEach((expected: string, key: string) => {
                let actual = fm.get(key);
                expect(actual).toEqual(expected);
            });
            expect(fm.get("foo")).toEqual("foo-val");
            expect(fm.get("bar")).toEqual("bar-val");
        } finally {
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename);
            }
        }
    });

    it('can read and write in parallel with other processes using same file', async () => {
        const runfile: string = path.join(process.cwd(), 'FileSystemMap', '.run');
        try {
            fileio.write(runfile, '');
            for (var i=0; i<5; i++) {
                let child: ChildProcess = spawn('npx', ['ts-node', './test/helpers/parallel.ts'], {shell: true, timeout: 30000});
                let out: string = '';
                let err: string = '';
                child.stdout.setEncoding('utf8');
                child.stdout.on('data', (data: any) => {
                    out += data;
                });
                child.stderr.setEncoding('utf8');
                child.stderr.on('data', (data: any) => {
                    err += data;
                });
                child.on('exit', (code: number, signal: NodeJS.Signals) => {
                    if (code != 0 && out.length > 0) { console.log(out); }
                    if (code != 0 && err.length > 0) { console.error(err); }
                });
                children.push(child);
            }
            const fm = new FileSystemMap<string, string>('parallel');
            const memory = new Map<string, string>();
            while (fm.size === 0) {
                await wait.forDuration(100);
            }

            for (var i=0; i<5; i++) {
                let key = rand.getString(rand.getInt(10, 20), true, true);
                let val = rand.getString(rand.getInt(100, 200));
        
                memory.set(key, val);
                fm.set(key, val);
        
                await wait.forDuration(rand.getInt(100, 400));
            }

            expect(fm.size).toBeGreaterThan(5);
            memory.forEach((expected: string, key: string) => {
                expect(fm.get(key)).toEqual(expected);
            });
        } finally {
            if (fs.existsSync(runfile)) {
                fs.unlinkSync(runfile);
            }
        }
    }, 40000);

    it('can remove a filesystem cache file using the same name used to create the file', () => {
        const filename = rand.getString(17);
        const fm = new FileSystemMap<string, string>(filename);
        fm.set(rand.getString(10), rand.getString(15));

        expect(fs.existsSync(path.join(process.cwd(), 'FileSystemMap', `${filename}.json`))).toBeTrue();

        FileSystemMap.removeCacheFile(filename);

        expect(fs.existsSync(path.join(process.cwd(), 'FileSystemMap', `${filename}.json`))).toBeFalse();
    });
});