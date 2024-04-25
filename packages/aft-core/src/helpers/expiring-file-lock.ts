import * as path from "path";
import * as os from "os";
import { SafeFlock } from "./safe-flock";
import { convert } from "./convert";
import { ellide } from "./ellide";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { Err } from "./err";

/**
 * class will create a new (or use existing) lockfile locking 
 * it using an exclusive `flock` that automatically will release
 * after the specified `maxDurataionMs` or when the `unlock` 
 * function is called. if the lock is not immediately available
 * the class will wait up to the `maxWaitDurationMs` before
 * throwing an exception
 * 
 * Ex:
 * ```json
 * // aftconfig.json
 * {
 *     "fileLockMaxWait": 10000,
 *     "fileLockMaxHold": 5000
 * }
 * ```
 * ```typescript
 * // wait a maximum of 10 seconds to aquire lock and then hold
 * // lock for maximum of 5 seconds or until `unlock` is called
 * const lock = new ExpiringFileLock('unique_name');
 * try {
 *     // perform action on shared resource...
 * } finally {
 *     lock?.unlock();
 * }
 * ```
 */
export class ExpiringFileLock {
    public readonly aftCfg: AftConfig;
    public readonly lockName: string;
    public readonly lockDuration: number;
    public readonly waitDuration: number;

    private readonly _safeFlock: SafeFlock;

    private _timeout: NodeJS.Timeout; // eslint-disable-line no-undef

    constructor(lockFileName: string, aftCfg?: AftConfig) {
        if (!lockFileName) {
            throw new Error(`[${this.constructor.name}] - lockFileName must be set`);
        }
        this.aftCfg = aftCfg ?? aftConfig;
        this.lockDuration = Math.abs(this.aftCfg.fileLockMaxHold ?? 10000); // ensure positive value; defaults to 10 s
        this.waitDuration = Math.abs(this.aftCfg.fileLockMaxWait ?? 10000); // ensure positive value; defaults to 10 s
        this.lockName = path.join(os.tmpdir(), ellide(convert.toSafeString(lockFileName), 255, 'beginning', ''));
        this._safeFlock = new SafeFlock(this.lockName, this.aftCfg);
        this._waitForLock();
    }

    /**
     * releases the lock and clears the automatic release
     * timer
     */
    unlock(): void {
        try {
            // runs async
            this._safeFlock.unlock(); // eslint-disable-line
        } catch {
            /* ignore */
        }
        if (this._timeout) {
            try {
                clearTimeout(this._timeout); // eslint-disable-line no-undef
            } catch {
                /* ignore */
            }
        }
    }

    private _waitForLock(): void {
        const startTime: number = Date.now();
        let err: Error;
        let haveLock = false;
        while (haveLock !== true && convert.toElapsedMs(startTime) < this.waitDuration) {
            try {
                haveLock = this._safeFlock.lock().locked;
                if (haveLock) {
                    this._timeout = setTimeout(() => this.unlock(), this.lockDuration); // eslint-disable-line no-undef
                }
            } catch (e) {
                err = e;
            }
        }
        if (haveLock !== true) {
            throw new Error(`unable to acquire lock on '${this.lockName}' within '${this.waitDuration}ms' due to: ${Err.full(err)}`);
        }
    }

    /**
     * creates a new `ExpiringFileLock` that can be used to ensure separate processes cannot cause
     * a race condition when accessing a shared resource
     * @param name the name of the lock file
     * @param wait the number of milliseconds to wait for a lock to be acquired
     * @param hold the number of milliseconds that a lock can be held before it automatically releases
     * @returns an `ExpiringFileLock` instance
     */
    static get(name: string, wait?: number, hold?: number): ExpiringFileLock {
        const aftCfg = new AftConfig();
        aftCfg.set('fileLockMaxHold', hold ?? aftCfg.fileLockMaxHold);
        aftCfg.set('fileLockMaxWait', wait ?? aftCfg.fileLockMaxWait);
        return new ExpiringFileLock(name, aftCfg);
    }
}

