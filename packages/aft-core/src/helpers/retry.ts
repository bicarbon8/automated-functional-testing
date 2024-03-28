import { AftConfig, aftConfig } from "../configuration/aft-config";
import { convert } from "./convert";
import { Func, RetryBackOffType } from "./custom-types";
import { wait } from "./wait";

/**
 * function will execute a passed in `Func<void, T | PromiseLike<T>>` and await a result, repeating execution at the passed
 * in `delay` interval (using the specified `backOffType` back-off) until the `condition` succeeds (returns `true`)
 */
export class Retry<T> implements PromiseLike<T> {
    private readonly _aftCfg: AftConfig;
    private readonly _retryable: Func<void, T | PromiseLike<T>>;
    
    private _condition: Func<T, boolean | PromiseLike<boolean>>;
    private _delay: number;
    private _backOffType: RetryBackOffType;
    private _maxAttempts: number;
    private _maxDuration: number;
    private _reject: boolean;
    private _currentDelay: number;
    private _result: T;
    private _success: boolean;
    private _totalAttempts: number;
    private _totalDuration: number;
    private _failAction: Func<void, any>;
    private _err: any;

    constructor(retryable: Func<void, T | PromiseLike<T>>, aftCfg?: AftConfig) {
        this._retryable = retryable;
        this._aftCfg = aftCfg ?? aftConfig;
        this._delay = this._aftCfg.retryDelayMs;
        this._currentDelay = this._delay;
        this._backOffType = this._aftCfg.retryBackOffType;
        this._maxAttempts = this._aftCfg.retryMaxAttempts;
        this._totalAttempts = 0;
        this._condition = (result: T) => result != null;
        this._maxDuration = this._aftCfg.retryMaxDurationMs;
        this._reject = this._aftCfg.retryRejectOnFail;
    }

    /**
     * the last result returned by the `retryable` or `undefined`. this can be used
     * if `RetryConfig.rejectOnFail` is set to `false`
     */
    get result(): T {
        return this._result;
    }

    /**
     * the total number of attempts actually executed at the time this is called. this
     * can be used if `RetryConfig.rejectOnFail` is set to `false`
     */
    get totalAttempts(): number {
        return this._totalAttempts;
    }

    /**
     * the last error returned by the `retryable` (if any). this can be used if
     * `RetryConfig.rejectOnFail` is set to `false`
     */
    get lastError(): any {
        return this._err;
    }

    /**
     * the total amount of time spent calling the `retryable` until it succeeded
     * or reached the maximum duration or number of attempts. this can be used if
     * `RetryConfig.rejectOnFail` is set to `false`
     */
    get totalDuration(): number {
        return this._totalDuration;
    }

    /**
     * a `boolean` indicating if the result of the `retryable` eventually passed the
     * `condition` successfully. a value of `false` indicates that either a maximum
     * duration or number of attempts was reached before success. this can be used if
     * `RetryConfig.rejectOnFail` is set to `false`
     */
    get isSuccessful(): boolean {
        return this._success;
    }

    /**
     * allows for specifying a custom `condition` to determine the success of calling
     * the `retryable` (default is if the `retryable` returns a non-null and non-undefined result)
     * @param condition a function that accepts an argument of type `T` and returns
     * a `boolean` result based on a comparison of the argument with an expectation
     * @returns the current `Retry<T>` instance
     */
    until(condition: Func<T, boolean | PromiseLike<boolean>>): this {
        this._condition = condition;
        return this;
    }

    withDelay(milliseconds: number): this {
        this._delay = milliseconds;
        return this;
    }

    withBackOff(backOffType: RetryBackOffType): this {
        this._backOffType = backOffType;
        return this;
    }

    withMaxDuration(milliseconds: number): this {
        this._maxDuration = milliseconds;
        return this;
    }

    withMaxAttempts(attempts: number): this {
        this._maxAttempts = attempts;
        return this;
    }

    withRejectOnFail(reject: boolean): this {
        this._reject = reject;
        return this;
    }

    /**
     * allows for specifying a function that will be called each time the
     * `retryable` is called and doesn't succeed (doesn't pass the `condition`)
     * @param func a function that accepts no arguments and returns anything
     * @returns the current `Retry<T>` instance
     */
    withFailAction(func: Func<void, any>): this {
        this._failAction = func;
        return this;
    }

    /**
     * tests the passed in `result` against the specified `condition` to
     * determine if it succeeds
     * @param result a value to test the `condition`
     * @returns `true` if the `result` successfully passes the `condition`
     * otherwise `false`
     */
    private async _isConditionMet(result: T): Promise<boolean> {
        return Promise.resolve(result)
            .then(this._condition)
            .catch(() => false);
    }
    
    async then<TResult1, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> { // eslint-disable-line no-unused-vars
        if (this._maxDuration < Infinity) {
            return wait.forResult(() => this._getInnerPromise(), this._maxDuration)
                .then(onfulfilled, onrejected);
        } else {
            return this._getInnerPromise()
                .then(onfulfilled, onrejected);
        }
    }

    private async _getInnerPromise(): Promise<T> {
        const startTime = Date.now();
        this._currentDelay = this._delay;
        this._success = false;
        this._totalDuration = 0;
        while (!this._success && this._totalAttempts < this._maxAttempts && this._totalDuration < this._maxDuration) {
            this._result = await Promise.resolve()
                .then(this._retryable)
                .catch((e) => {
                    this._err = e;
                    return undefined;
                });

            this._success = await this._isConditionMet(this._result);
            if (!this._success) {
                if (this._failAction) {
                    await Promise.resolve()
                        .then(this._failAction)
                        .catch(() => {
                            /* ignore */
                        });
                }
                await wait.forDuration(this._currentDelay);
            }
            this._totalAttempts++;
            this._currentDelay = Retry.calculateBackOffDelay(this._delay, this._currentDelay, this._backOffType);
            this._totalDuration = convert.toElapsedMs(startTime);
        }
        if (!this._success && this._reject) {
            return Promise.reject(`[${this.constructor.name}] unable to get a successful result after`
                + ` ${convert.toHoursMinutesSeconds(this._totalDuration)} over ${this._totalAttempts} attempts`);
        }
        return this._result;
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
 *     "retryDelayMs": 1000,
 *     "retryBackOffType": "exponential",
 *     "retryMaxAttempts": 10,
 *     "retryMaxDurationMs": 30000
 * }
 * ```
 * ```typescript
 * // in your code
 * const result = await retry<number>(() => someAction()).until((res: number) => res === 5);
 * ```
 * 
 * Ex: overriding `aftconfig.json` to control conditions
 * ```typescript
 * // in your code
 * const result = await retry<number>(() => someAction(), new AftConfig({
 *     retryDelayMs: 1000,
 *     retryBackOffType: 'exponential',
 *     retryMaxAttempts: 10,
 *     retryMaxDurationMs: 30000
 * })).unti((res: number) => res === 5);
 * ```
 * @param retryable the function to be retried until it passes a default
 * condition of return value != null or a custom `condition`
 * @param aftCfg an optional `AftConfig` instance allowing you to override the default settings in `aftconfig.json`
 * @returns a new `Retry<T>` instance
 */
export const retry = <T>(retryable: Func<void, T | PromiseLike<T>>, aftCfg?: AftConfig): Retry<T> => {
    return new Retry<T>(retryable, aftCfg);
};
