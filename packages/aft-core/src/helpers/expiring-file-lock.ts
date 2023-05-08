import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { flockSync } from "fs-ext";
import { convert } from "./convert";
import { ellide } from "./ellide";
import { AftConfig, aftConfig } from "../configuration/aft-config";

export class ExpriringFileLockConfig {
    maxWaitMs: number = 1000;
    maxHoldMs: number = 1000;
}

/**
 * class will create a new (or use existing) lockfile locking 
 * it using an exclusive `flock` that automatically will release
 * after the specified `maxDurataionMs` or when the `unlock` 
 * function is called. if the lock is not immediately available
 * the class will wait up to the `maxWaitDurationMs` before
 * throwing an exception
 * 
 * Ex:
 * ```
 * const maxWait = 10000; // 10 seconds
 * const maxHold = 5000; // 5 seconds
 * // wait a maximum of 10 seconds to aquire lock and then hold
 * // lock for maximum of 5 seconds or until `unlock` is called
 * const lock = new ExpiringFileLock('unique_name', maxWait, maxHold);
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

    private readonly _lockFileDescriptor: number;
    private readonly _timeout: NodeJS.Timeout;
    
    constructor(lockFileName: string, aftCfg?: AftConfig) {
        if (!lockFileName) {
            throw `[${this.constructor.name}] - lockFileName must be set`;
        }
        this.aftCfg = aftCfg ?? aftConfig;
        const eflc = this.aftCfg.getSection(ExpriringFileLockConfig);
        this.lockDuration = Math.abs(eflc?.maxHoldMs); // ensure positive value; defaults to 1 s
        this.waitDuration = Math.abs(eflc?.maxWaitMs); // ensure positive value; defaults to 1 s
        this.lockName = path.join(os.tmpdir(), ellide(convert.toSafeString(lockFileName), 255, 'beginning', ''));
        this._lockFileDescriptor = this._waitForLock();
        this._timeout = setTimeout(() => flockSync(this._lockFileDescriptor, 'un'), this.lockDuration);
    }

    /**
     * releases the lock and clears the automatic release
     * timer
     */
    unlock(): void {
        clearTimeout(this._timeout);
        flockSync(this._lockFileDescriptor, 'un');
    }

    private _waitForLock(): number {
        const startTime: number = new Date().getTime();
        let haveLock: boolean = false;
        let lockFileDescriptor: number;
        while (!haveLock && convert.toElapsedMs(startTime) < this.waitDuration) {
            if (!lockFileDescriptor) {
                try {
                    lockFileDescriptor = fs.openSync(this.lockName, 'w');
                } catch (e) {
                    /* ignore */
                }
            }
            if (lockFileDescriptor) {
                try {
                    flockSync(lockFileDescriptor, 'ex');
                    haveLock = true;
                } catch (e) {
                    /* ignore */
                }
            }
        }
        if (!lockFileDescriptor) {
            throw `unable to acquire lock on '${this.lockName}' within '${this.waitDuration}ms'`;
        }
        return lockFileDescriptor;
    }
}