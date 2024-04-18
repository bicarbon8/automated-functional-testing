import * as fs from "node:fs";
import { AftLogger } from "../logging/aft-logger";
import { Err } from "./err";
import { rand } from "./rand";

type FlockFlags = 'ex' | 'un' | "sh" | "shnb" | "exnb";
type FlockFunction = (fn: number, flags: FlockFlags) => void; // eslint-disable-line no-unused-vars

/**
 * provides an execution environment agnostic way of loading the
 * `flockSync` functionality from the `fs-ext` package to avoid
 * a `Module did not self-register: ...fs-ext.node` error. usage
 * is as follows:
 * ```typescript
 * // get exclusive file lock or throw error
 * const sflock = new SafeFlock(file).lock();
 * 
 * // release file lock
 * sflock.unlock();
 * ```
 * **NOTE**
 * > this should _NOT_ be exported from AFT
 */
export class SafeFlock {
    private readonly _flockSync: FlockFunction;
    private readonly _logger: AftLogger;
    private readonly _id: string;
    private readonly _file: string;

    private _fd: number;

    constructor(file: string) {
        this._id = rand.guid;
        this._logger = new AftLogger(this.constructor.name);
        try {
            // const fse = require("fs-ext"); // eslint-disable-line no-undef
            // this._flockSync = fse.flockSync;
        } catch (e) {
            this._logger.log({
                level: 'warn',
                message: `unable to load 'fs-ext.flockSync' due to: ${Err.full(e)}\ncontinuing without file locks`
            });
        }
        this._file = file;
    }

    /**
     * places an exclusive lock on the given `file` file if possible and
     * throws error otherwise
     * @returns a reference to `this` instance
     */
    lock(): this {
        let fd: number;
        if (this._flockSync) {
            fd = fs.openSync(this._file, 'w');
            this._flockSync(fd, 'ex');
            this._fd = fd;
        } else {
            this._fallbackLock()
        }
        return this;
    }

    /**
     * releases the lock if this instance owns it otherwise throws an
     * error
     * @returns a reference to `this` instance
     */
    unlock(): this {
        if (this._flockSync) {
            try {
                this._flockSync(this._fd, 'un');
            } finally {
                if (this._fd) {
                    fs.closeSync(this._fd);
                    this._fd = null;
                }
            }
        } else {
            this._fallbackUnlock();
        }
        return this;
    }

    private _fallbackLock(): void {
        // open for read and append and create if not already exists
        if (!fs.existsSync(this._file)) {
            fs.writeFileSync(this._file, this._id, {encoding: 'utf-8'});
        }
        const contents: string = fs.readFileSync(this._file, {encoding: 'utf-8'});
        if (contents == null || contents === '') {
            fs.writeFileSync(this._file, this._id, {encoding: 'utf-8'});
            this._fallbackLock(); // ensure we have lock
        } else if (contents === this._id) {
            /* we already have lock */
            this._logger.log({level: 'debug', message: 'successfully locked'});
        } else {
            throw new Error(`file '${this._file}' is already locked by someone else`);
        }
    }

    private _fallbackUnlock(): void {
        try {
            const contents: string = fs.readFileSync(this._file, {encoding: 'utf-8'});
            if (contents === this._id) {
                fs.writeFileSync(this._file, '', {encoding: 'utf-8'});
                this._fallbackUnlock(); // ensure unlocked
            } else if (contents == null || contents === '') {
                /* we already unlocked */
                this._logger.log({level: 'debug', message: 'successfully unlocked'});
            } else {
                throw new Error(`unable to unlock '${this._file}' because we are not the owner of the lock`);
            }
        } finally {
            if (this._fd) {
                this._fd = null;
            }
        }
    }
}
