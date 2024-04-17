import { AftLogger } from "../logging/aft-logger";
import { Err } from "./err";

type FlockFlags = 'ex' | 'un' | "sh" | "shnb" | "exnb";
type FlockFunction = (fn: number, flags: FlockFlags) => void;

class SafeFlock {
    private readonly _flockSync: FlockFunction;
    private readonly _logger: AftLogger;

    constructor() {
        this._logger = new AftLogger(this.constructor.name);
        try {
            const fse = require("fs-ext");
            this._flockSync = fse.flockSync;
        } catch (e) {
            this._flockSync = (fn: number, flags: FlockFlags) => { /* do nothing */ }; // eslint-disable-line no-unused-vars
            this._logger.log({
                level: 'warn',
                message: `unable to load 'fs-ext.flockSync' due to: ${Err.full(e)}\ncontinuing without file locks`
            });
        }
    }

    /**
     * performs a specified action against a file such as waiting for an exclusive
     * lock or releasing a lock based on the passed in `fd` and `flag`
     * @param fd a file descriptor number returned from a call like `fs.openSync(...)`
     * @param flag a string indicating what action to perform agains the file where
     * `ex` waits for an exclusive lock and `un` releases the lock
     */
    get(fd: number, flag: FlockFlags): void {
        this._flockSync(fd, flag);
    }
}

/**
 * provides an execution environment agnostic way of loading the
 * `flockSync` functionality from the `fs-ext` package to avoid
 * a `Module did not self-register: ...fs-ext.node` error. usage
 * is exactly like calling `flockSync`:
 * ```typescript
 * // wait for exclusive file lock
 * safeFlock.get(fileDescriptor, 'ex');
 * 
 * // release file lock
 * safeFlock.get(fileDescriptor, 'un');
 * ```
 * **NOTE**
 * > this should _NOT_ be exported from AFT
 */
export const safeFlock = new SafeFlock();
