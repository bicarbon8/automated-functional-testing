import * as fs from "node:fs";
import { AftLogger } from "../logging/aft-logger";
import { rand } from "./rand";
import { AftConfig } from "../configuration/aft-config";

/**
 * provides an execution environment agnostic way of creating
 * an exclusive lock when running across multiple node processes
 * usage is as follows:
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
    private readonly _logger: AftLogger;
    private readonly _id: string;
    private readonly _file: string;

    private _locked: boolean;

    constructor(file: string, aftCfg?: AftConfig) {
        this._id = rand.guid;
        this._logger = new AftLogger(this.constructor.name, aftCfg);
        this._file = file;
        this._locked = false;
    }

    get locked(): boolean {
        return this._locked === true;
    }

    /**
     * places an exclusive lock on the given `file` file if possible and
     * throws error otherwise
     * @returns this instance for command chaining
     */
    lock(): this {
        // open for read and append and create if not already exists
        if (!fs.existsSync(this._file)) {
            fs.writeFileSync(this._file, this._id, {encoding: 'utf-8'});
        }
        const contents: string = fs.readFileSync(this._file, {encoding: 'utf-8'});
        if (contents == null || contents === '') {
            fs.writeFileSync(this._file, this._id, {encoding: 'utf-8'});
            this.lock(); // ensure we have lock
        } else if (contents === this._id) {
            /* we already have lock */
            this._locked = true;
            this._logger.log({level: 'trace', message: 'successfully locked'});
        } else {
            throw new Error(`file '${this._file}' is already locked by someone else`);
        }
        return this;
    }

    /**
     * releases the lock if this instance owns it otherwise throws an
     * error
     * @returns this instance for command chaining
     */
    unlock(): this {
        const contents: string = fs.readFileSync(this._file, {encoding: 'utf-8'});
        if (contents === this._id) {
            fs.writeFileSync(this._file, '', {encoding: 'utf-8'});
            this.unlock(); // ensure unlocked
        } else if (contents == null || contents === '') {
            /* we already unlocked */
            this._logger.log({level: 'trace', message: 'successfully unlocked'});
        } else {
            throw new Error(`unable to unlock '${this._file}' because we are not the owner of the lock`);
        }
        return this;
    }
}
