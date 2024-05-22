import * as process from 'node:process';
import * as fs from "node:fs";
import * as path from "node:path";
import { Func } from "./custom-types";

export class FileIO {
    /**
     * function creates a new `utf-8` encoded file and writes the passed in `data` string
     * to it. if the `file` contains directories and these directories do not already exist
     * they will be created and then the file will be created and written to
     * @param file the full path and filename to write to
     * @param data the contents to write
     */
    write(file: string, data: string = ''): void {
        if (!path.isAbsolute(file)) {
            file = fs.realpathSync(path.join(process.cwd(), file));
        }
        let fd: number;
        try {
            fd = fs.openSync(file, 'w+');
            fs.writeFileSync(fd, data, {encoding: 'utf-8'});
            fs.fsyncSync(fd);
        } catch (e) {
            const p = path.dirname(file);
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p, {recursive: true});
                this.write(file, data);
            } else {
                throw e;
            }
        } finally {
            if (fd) {
                fs.closeSync(fd);
            }
        }
    }

    /**
     * function opens a `utf-8` encoded file (or creates if it doesn't already exist)
     * and appends the passed in `data` string to it. if the `file` contains 
     * directories and these directories do not already exist they will be created 
     * and then the file will be created and appended to
     * @param file the full path and filename to write to
     * @param data the contents to append
     */
    append(file: string, data: string = ''): void {
        if (!path.isAbsolute(file)) {
            file = fs.realpathSync(path.join(process.cwd(), file));
        }
        let fd: number;
        try {
            fd = fs.openSync(file, 'a+');
            fs.appendFileSync(fd, data, {encoding: 'utf-8'});
            fs.fsyncSync(fd);
        } catch (e) {
            const p = path.dirname(file);
            if (!fs.existsSync(p)) {
                fs.mkdirSync(p, {recursive: true});
                this.write(file, data);
            } else {
                throw e;
            }
        } finally {
            if (fd) {
                fs.closeSync(fd);
            }
        }
    }

    /**
     * opens the specified file and returns the contents as a UTF-8 string
     * and then closes the file
     * @param file the relative or full path to an existing file
     * @returns the contents of the specifie file as a string
     */
    read(file: string): string {
        if (!path.isAbsolute(file)) {
            file = fs.realpathSync(path.join(process.cwd(), file));
        }
        if (fs.statSync(file).isDirectory()) {
            throw new Error(`[fileio.readAs<T>] expected filename but received directory instead: ${file}`);
        }
        const fd: number = fs.openSync(file, 'rs+');
        let fileContents: string;
        try {
            fs.fsyncSync(fd);
            fileContents = fs.readFileSync(fd, {encoding: 'utf-8'});
        } finally {
            if (fd) {
                fs.closeSync(fd);
            }
        }
        return fileContents;
    }

    /**
     * attempts to parse the contents of a file into a simple JSON object
     * @param file the relative or full path to an existing file
     * @returns the contents of the specified file parsed into a simple object
     */
    readAs<T>(file: string, jsonParser?: Func<string, T>): T {
        const fileContents = this.read(file);
        const parser: Func<string, T> = jsonParser || function(inStr: string): T { return JSON.parse(inStr) as T; }
        let obj: T;
        try {
            obj = parser(fileContents);
        } catch (e) {
            // ignore :(
        }
        return obj;
    }

    /**
     * deletes the passed in file or directory
     * @param file the relative or full path to a file or directory to delete
     */
    delete(file: string): void {
        if (!path.isAbsolute(file)) {
            file = fs.realpathSync(path.join(process.cwd(), file));
        }
        if (fs.existsSync(file)) {
            const opts: fs.RmOptions = {force: true};
            if (fs.statSync(file).isDirectory()) {
                opts.recursive = true;
            }
            try {
                fs.rmSync(file, opts);
            } catch (e) {
                // ignore :(
            }
        }
    }
}

export const fileio = new FileIO();
