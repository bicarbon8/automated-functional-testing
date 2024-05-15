import { isNumber } from "lodash";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { convert } from "./convert";
import { Func, ProcessingResult } from "./custom-types";
import { Err } from "./err";
import { wait } from "./wait";

/**
 * a retry back-off delay type where `constant` uses the same
 * delay each time, `linear` adds the start delay to the previous
 * on each iteration and `exponential` doubles the previous delay
 */
export type RetryBackOffType = 'constant' | 'linear' | 'exponential';

export type RetryOptions = {
    /**
     * the amount of time in milliseconds between attempts
     * 
     * **NOTE**
     * > this is only the starting amount if using a
     * `RetryBackOffType` of `linear` or `exponential`
     * as the value will continually increase on each
     * retry attempt.
     * @default 1
     */
    delay?: number;
    /**
     * a value indicating if the delay between retry
     * attempts remains the same each time or increases
     * based on some calculation
     * @default 'constant'
     */
    backOffType?: RetryBackOffType;
    /**
     * the maximum number of milliseconds to attempt
     * retries. leaving this unset or set to a value
     * of `Infinity` means there is no duration limit
     * @default Infinity
     */
    maxDuration?: number;
    /**
     * the maximum number of retry attempts to make
     * before giving up. leaving this unset or set to
     * a value of `Infinity` means there is no limit
     * @default Infinity
     */
    maxAttempts?: number;
    /**
     * if set to `true` then an `Error` will be thrown
     * after the last attempt has failed
     * @default true
     */
    errorOnFail?: boolean;
    /**
     * allows for specifying a function that will be called each time the
     * `retryable` is called and doesn't succeed (doesn't pass the `condition`)
     * @param action an `Func<void, void | PromiseLike<void>>` accepting no arguments and returning nothing
     * @returns the current `Retry<T>` instance
     */
    failAction?: Func<void, void | PromiseLike<void>>;
};

export class RetryConfig implements Omit<RetryOptions, 'failAction'> {
    delay?: number = 1;
    backOffType?: RetryBackOffType = 'constant';
    maxDuration?: number = Infinity;
    maxAttempts?: number = Infinity;
    errorOnFail?: boolean = true;
}

/**
 * a class used to retry some action until some condition is met. the result of
 * the action is passed to the condition function and the end result is returned
 * from the `until` function (or `undefined` if the condition is never met and all
 * retry attempts are used up)
 */
export class Retry<T> {
    private readonly _aftCfg: AftConfig;
    private readonly _retryable: Func<Retry<T>, T | PromiseLike<T>>;

    private _delay: number;
    private _backOffType: RetryBackOffType;
    private  _maxAttempts: number;
    private _maxDuration: number;
    private _reject: boolean;
    private _failAction: Func<void, void | PromiseLike<void>>;

    private _currentDelay: number;
    private _result: T;
    private _success: boolean;
    private _totalAttempts: number;
    private _totalDuration: number;
    private _err: any;

    constructor(retryable: Func<Retry<T>, T | PromiseLike<T>>, aftCfg?: AftConfig) {
        this._retryable = retryable;
        this._aftCfg = aftCfg ?? aftConfig;
        const rc: RetryConfig = this._aftCfg.getSection(RetryConfig);
        
        this._delay = rc.delay;
        this._currentDelay = this._delay;
        this._backOffType = rc.backOffType;
        this._maxAttempts = rc.maxAttempts;
        this._totalAttempts = 0;
        this._maxDuration = rc.maxDuration;
        this._reject = rc.errorOnFail;
    }

    /**
     * the last result returned by the `retryable` or `undefined`. this can be used
     * if `RetryConfig.errorOnFail` is set to `false`
     */
    get result(): T {
        return this._result;
    }

    /**
     * the total number of attempts actually executed at the time this is called. this
     * can be used if `RetryConfig.errorOnFail` is set to `false`
     */
    get totalAttempts(): number {
        return this._totalAttempts;
    }

    /**
     * the last error returned by the `retryable` (if any). this can be used if
     * `RetryConfig.errorOnFail` is set to `false`
     */
    get lastError(): any {
        return this._err;
    }

    /**
     * the total amount of time spent calling the `retryable` until it succeeded
     * or reached the maximum duration or number of attempts. this can be used if
     * `RetryConfig.errorOnFail` is set to `false`
     */
    get totalDuration(): number {
        return this._totalDuration;
    }

    /**
     * a `boolean` indicating if the result of the `retryable` eventually passed the
     * `condition` successfully. a value of `false` indicates that either a maximum
     * duration or number of attempts was reached before success. this can be used if
     * `RetryConfig.errorOnFail` is set to `false`
     */
    get isSuccessful(): boolean {
        return this._success;
    }

    /**
     * the amount of time in milliseconds between attempts
     * 
     * **NOTE**
     * > this is only the starting amount if using a
     * `RetryBackOffType` of `linear` or `exponential`
     * as the value will continually increase on each
     * retry attempt.
     * @default 1
     * @returns the current `Retry<T>` instance
     */
    withDelay(delay: number): this {
        if (isNumber(delay) && !isNaN(delay) && delay >= 0) {
            this._delay = delay;
        }
        return this;
    }

    /**
     * a value indicating if the delay between retry
     * attempts remains the same each time or increases
     * based on some calculation
     * @default 'constant'
     * @returns the current `Retry<T>` instance
     */
    withBackOffType(backOffType: RetryBackOffType): this {
        if (backOffType) {
            this._backOffType = backOffType;
        }
        return this;
    }

    /**
     * the maximum number of milliseconds to attempt
     * retries. leaving this unset or set to a value
     * of `Infinity` means there is no duration limit
     * @default Infinity
     * @returns the current `Retry<T>` instance
     */
    withMaxDuration(duration: number): this {
        if (isNumber(duration) && !isNaN(duration) && duration >= 0) {
            this._maxDuration = duration;
        }
        return this;
    }

    /**
     * the maximum number of retry attempts to make
     * before giving up. leaving this unset or set to
     * a value of `Infinity` means there is no limit
     * @default Infinity
     * @returns the current `Retry<T>` instance
     */
    withMaxAttempts(attempts: number): this {
        if (isNumber(attempts) && !isNaN(attempts) && attempts >= 0) {
            this._maxAttempts = attempts;
        }
        return this;
    }

    /**
     * if set to `true` then an `Error` will be thrown
     * after the last attempt has failed
     * @default true
     * @returns the current `Retry<T>` instance
     */
    withErrorOnFail(reject: boolean): this {
        if (reject != null) {
            this._reject = Boolean(reject);
        }
        return this;
    }

    /**
     * allows for specifying a function that will be called each time the
     * `retryable` is called and doesn't succeed (doesn't pass the `condition`)
     * @param action an `Func<void, void | PromiseLike<void>>` accepting no arguments and returning nothing
     * @returns the current `Retry<T>` instance
     */
    withFailAction(action: Func<void, void | PromiseLike<void>>): this {
        this._failAction = action;
        return this;
    }

    /**
     * allows for specifying a custom `condition` to determine the success of calling
     * the `retryable` (default is if the `retryable` returns a non-null and non-undefined result)
     * @param condition a function that accepts an argument of type `T` and returns
     * a `boolean` result based on a comparison of the argument with an expectation
     * @returns the current `Retry<T>` instance
     */
    async until(condition: Func<T, boolean | PromiseLike<boolean>>): Promise<T> {
        const startTime = Date.now();
        this._currentDelay = this._delay;
        this._success = false;
        this._totalDuration = 0;
        while (this._shouldContinue(this._success)) {
            try {
                this._totalAttempts++;
                this._result = await this._retryable(this);
            } catch(e) {
                this._err = e;
                this._result = undefined;
            }

            this._success = await this._checkResult(condition);
            this._currentDelay = Retry.calculateBackOffDelay(this._delay, this._currentDelay, this._backOffType);
            this._totalDuration = convert.toElapsedMs(startTime);
        }
        if (!this._success && this._reject) {
            throw new Error(`[${this.constructor.name}] unable to get a successful result after`
                + ` ${convert.toHoursMinutesSeconds(this._totalDuration)} over ${this._totalAttempts} attempts`);
        }
        return this._result;
    }

    /**
     * runs the `retryable` until it returns a value
     * that is not `null` or `undefined`
     * @returns the result from the retry attempts
     */
    async start(): Promise<T> {
        return this.until((res: T) => res != null);
    }

    private _shouldContinue(success: boolean): boolean {
        return !success
            && this._totalAttempts < this._maxAttempts
            && this._totalDuration < this._maxDuration;
    }

    private async _checkResult(condition: Func<T, boolean | PromiseLike<boolean>>): Promise<boolean> {
        const res: ProcessingResult<boolean> = await Err.handleAsync(() => {
            return this._isConditionMet(condition, this._result)
        }, {errLevel: 'none'}); // no automatic logging output
        const success = res.result ?? false;
        if (!success) {
            if (this._failAction) {
                await Err.handleAsync(() => this._failAction(), {errLevel: 'none'});
            }
            await wait.forDuration(this._currentDelay);
        }
        return success;
    }

    /**
     * tests the passed in `result` against the specified `condition` to
     * determine if it succeeds
     * @param result a value to test the `condition`
     * @returns `true` if the `result` successfully passes the `condition`
     * otherwise `false`
     */
    private async _isConditionMet(condition: Func<T, boolean | PromiseLike<boolean>>, result: T): Promise<boolean> {
        try {
            const output: boolean = await condition(result);
            return output ?? false;
        } catch (e) {
            return false;
        }
    }

    /**
     * calculates the number of milliseconds to delay between retry attempts using a
     * `RetryBackOffType` to determine if the value should increase and how if so.
     * 
     * Ex:
     * ```
     * Retry.calculateBackOffDelay(10, 200, 'linear'); // returns 210
     * Retry.calculateBackOffDelay(10, 200, 'exponential'); // returns 400
     * Retry.calculateBackOffDelay(10, 200, 'constant'); // returns 10
     * ```
     * @param startDelayMs the number of milliseconds delay at the start
     * @param currentDelayMs the number of milliseconds delay last used
     * @param retryType the `RetryBackOffType` delay type to use
     * @returns the number of milliseconds to delay next time
     */
    static calculateBackOffDelay(startDelayMs: number, currentDelayMs: number, retryType: RetryBackOffType): number {
        switch (retryType) {
            case 'linear':
                return currentDelayMs + startDelayMs;
            case 'exponential':
                return currentDelayMs * 2;
            case 'constant':
            default:
                return startDelayMs;
        }
    }
}

/**
 * generates a new `Retry<T>` instance that runs a given `retryable` until it
 * successfully passes a `condition`
 * 
 * Ex: using `aftconfig.json` to control conditions
 * ```json
 * // aftconfig.json
 * {
 *     "RetryConfig": {
 *         "delay": 1000,
 *         "backOffType": "exponential",
 *         "maxAttempts": 10,
 *         "maxDuration": 30000
 *     }
 * }
 * ```
 * ```typescript
 * // in your code
 * const result = await retry<number>(() => someAction()).until((res: number) => res === 5);
 * 
 * console.log(result); // 5
 * ```
 * 
 * Ex: overriding `aftconfig.json` to control conditions
 * ```typescript
 * // in your code
 * const result = await retry<number>(() => someAction(), {
 *     delay: 1000,
 *     backOffType: 'linear',
 *     maxAttempts: 3,
 *     maxDuration: 30000,
 *     errorOnFail: false,
 *     failAction: () => doStuff()
 * }).until((res: number) => res === 5);
 * 
 * console.log(result); // 3 (because `maxAttempts` is 3)
 * ```
 * @param retryable the function to be retried until it passes a default
 * condition of return value != null or a custom `condition`
 * @param options an optional `RetryOptions` instance allowing you to override the default settings in `aftconfig.json`
 * @returns a new `Retry<T>` instance
 */
export const retry = <T>(retryable: Func<Retry<T>, T | PromiseLike<T>>, options?: RetryOptions): Retry<T> => {
    options ??= {};
    return new Retry<T>(retryable)
        .withDelay(options.delay)
        .withBackOffType(options.backOffType)
        .withMaxAttempts(options.maxAttempts)
        .withMaxDuration(options.maxDuration)
        .withErrorOnFail(options.errorOnFail);
};
