import process = require("process");
import * as fs from "fs";
import * as path from "path";
import { Func } from "./custom-types";

class FileIO {
    /**
     * function creates a new `utf-8` encoded file and writes the passed in `data` string
     * to it. if the `file` contains directories and these directories do not already exist
     * they will be created and then the file will be created and written to
     * @param file the full path and filename to write to
     * @param data the contents to write
     */
    write(file: string, data: string = ''): void {
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
     * attempts to parse the contents of a file into a simple JSON object
     * @param file the full path to an existing file
     * @returns the contents of the specified file parsed into a simple object
     */
    readAs<T>(file: string, jsonParser?: Func<string, T>): T {
        if (fs.statSync(file).isDirectory()) {
            throw `[fileio.readAs<T>] expected filename but received directory instead: ${file}`;
        }
        if (!path.isAbsolute(file)) {
            file = fs.realpathSync(path.join(process.cwd(), file));
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
        const parser: Func<string, T> = jsonParser || function(inStr: string): T { return JSON.parse(inStr) as T; }
        let obj: T;
        try {
            obj = parser(fileContents);
        } catch (e) {
            /* ignore */
        }
        return obj;
    }
}

export const fileio = new FileIO();
