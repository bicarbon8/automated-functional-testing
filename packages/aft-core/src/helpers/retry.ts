import { convert } from "./convert";
import { Func, RetryBackOffType } from "./custom-types";
import { wait } from "./wait";

/**
 * function will execute a passed in `Func<void, T | PromiseLike<T>>` and await a result, repeating execution at the passed
 * in `delay` interval (using the specified `backOffType` back-off) until the `condition` succeeds (returns `true`)
 */
export class Retry<T> implements PromiseLike<T> {
    #retryable: Func<void, T | PromiseLike<T>>;
    #result: T;
    #delay: number;
    #currentDelay: number;
    #backOffType: RetryBackOffType;
    #condition: Func<T, boolean | PromiseLike<boolean>>;
    #maxAttempts: number;
    #totalAttempts: number;
    #failAction: Func<void, any>;
    #err: any;
    #maxDuration: number;
    #totalDuration: number;
    #success: boolean;
    #reject: boolean;

    constructor(retryable: Func<void, T | PromiseLike<T>>) {
        this.#retryable = retryable;
        this.#delay = 1;
        this.#currentDelay = this.#delay;
        this.#backOffType = 'constant';
        this.#maxAttempts = Infinity;
        this.#totalAttempts = 0;
        this.#condition = (result: T) => result != null;
        this.#maxDuration = Infinity;
        this.#reject = true;
    }

    /**
     * the `Func<void, T | PromiseLike<T>>` to call until it's return
     * value passes the `condition`
     */
    get retryable(): Func<void, T | PromiseLike<T>> {
        return this.#retryable;
    }

    /**
     * the last result returned by the `retryable` or `undefined`
     */
    get result(): T {
        return this.#result;
    }

    /**
     * the starting amount to delay between retries (defaults to 1ms).
     * call `withStartDelayBetweenAttempts(number)` to specify a value
     */
    get startDelay(): number {
        return this.#delay;
    }

    /**
     * the millisecond delay amount most recently used (or to be used) between
     * retry attempts 
     */
    get currentDelay(): number {
        return this.#currentDelay;
    }

    /**
     * the `RetryBackOffType` used to determine how the delay between
     * attempts changes on each subsequent attempt
     */
    get backOffType(): RetryBackOffType {
        return this.#backOffType;
    }

    /**
     * a `Func<T, boolean | PromiseLike<boolean>` (function accepting an argument of type `T`
     * and returning a boolean result) that is used to determine if the `retryable` is successful
     */
    get condition(): Func<T, boolean | PromiseLike<boolean>> {
        return this.#condition;
    }

    /**
     * the maximum number of retries to attempt before giving up (defaults to `Infinity`).
     * call `withMaxAttempts(number)` to specify a value
     */
    get maxAttempts(): number {
        return this.#maxAttempts;
    }

    /**
     * the total number of attempts actually executed at the time this is called
     */
    get totalAttempts(): number {
        return this.#totalAttempts;
    }

    /**
     * a `Func<void, any>` to call each time the `retryable` does not succeed
     * (defaults to undefined). call `withFailAction(func)` to specify a value
     */
    get failAction(): Func<void, any> {
        return this.#failAction;
    }

    /**
     * the last error returned by the `retryable` (if any)
     */
    get lastError(): any {
        return this.#err;
    }

    /**
     * a maximum amount of time to call the `retryable` if it is not successful
     * (defaults to `Infinity`). call `withMaxDuration(number)` to specify a value
     */
    get maxDuration(): number {
        return this.#maxDuration;
    }

    /**
     * the total amount of time spent calling the `retryable` until it succeeded
     * or reached the maximum duration or number of attempts
     */
    get totalDuration(): number {
        return this.#totalDuration;
    }

    /**
     * a `boolean` indicating if the result of the `retryable` eventually passed the
     * `condition` successfully. a value of `false` indicates that either a maximum
     * duration or number of attempts was reached before success
     */
    get isSuccessful(): boolean {
        return this.#success;
    }

    /**
     * a `boolean` indicating if a rejected promise should be returned if the `retryable`
     * does not successfully pass the `condition` within either the maximum number of 
     * attempts or duration specified (default is `true`). call `rejectIfUnsuccessful(false)`
     * to change the default behaviour to resolve the promise with `undefined` instead
     */
    get reject(): boolean {
        return this.#reject;
    }

    /**
     * allows for specifying a starting number of milliseconds to delay between retry
     * attempts (defaults to 1ms)
     * @param delayMs the starting number of milliseconds to delay between attempts
     * @returns the current `Retry<T>` instance
     */
    withStartDelayBetweenAttempts(delayMs: number): this {
        this.#delay = delayMs;
        return this;
    }

    /**
     * allows for specifying a `RetryBackOffType` used to calculate the delay between attempts
     * (default is `constant` which will continually use the value specified for `startDelay`)
     * @param backOffType a `RetryBackOffType` used to calculate the delay between attempts
     * @returns the current `Retry<T>` instance
     */
    withBackOff(backOffType: RetryBackOffType): this {
        this.#backOffType = backOffType;
        return this;
    }

    /**
     * allows for specifying a custom `condition` to determine the success of calling
     * the `retryable` (default is if the `retryable` returns a non-null and non-undefined result)
     * @param condition a function that accepts an argument of type `T` and returns
     * a `boolean` result based on a comparison of the argument with an expectation
     * @returns the current `Retry<T>` instance
     */
    until(condition: Func<T, boolean | PromiseLike<boolean>>): this {
        this.#condition = condition;
        return this;
    }

    /**
     * allows for specifying a limit to the number of retry attempts
     * @param maxAttempts the maximum number of times to call the `retryable`
     * @returns the current `Retry<T>` instance
     */
    withMaxAttempts(maxAttempts: number): this {
        this.#maxAttempts = maxAttempts;
        return this;
    }

    /**
     * allows for specifying a function that will be called each time the
     * `retryable` is called and doesn't succeed (doesn't pass the `condition`)
     * @param func a function that accepts no arguments and returns anything
     * @returns the current `Retry<T>` instance
     */
    withFailAction(func: Func<void, any>): this {
        this.#failAction = func;
        return this;
    }

    /**
     * allows for specifying the maximum number of milliseconds to wait for
     * the `retryable` to return a value that passes the `condition` (defaults
     * to `Infinity`)
     * @param durationMs the maximum number of milliseconds to wait for the
     * `retryable` to succeed
     * @returns the current `Retry<T>` instance
     */
    withMaxDuration(durationMs: number): this {
        this.#maxDuration = durationMs;
        return this;
    }

    /**
     * allows for specifying `false` if `undefined` should be returned if the `retryable`
     * cannot successfully pass the `condition` instead of returning a rejected promise
     * @param enable a `boolean` indicating if a rejected promise should be returned
     * if the `retryable` is unable to successfully pass the `condition` within either
     * the maximum number of attempts or duration specified (default is `true`)
     * @returns `true` if a rejected promise is returned on failure or `false` if a
     * resolved promise of `undefined` should be returned instead
     */
    rejectIfUnsuccessful(enable: boolean): this {
        this.#reject = enable;
        return this;
    }

    /**
     * tests the passed in `result` against the specified `condition` to
     * determine if it succeeds
     * @param result a value to test the `condition`
     * @returns `true` if the `result` successfully passes the `condition`
     * otherwise `false`
     */
    async isConditionMet(result: T): Promise<boolean> {
        return Promise.resolve(result)
            .then(this.condition)
            .catch(() => false);
    }
    
    async then<TResult1, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        if (this.maxDuration < Infinity) {
            return wait.forResult(() => this._getInnerPromise(), this.maxDuration)
                .then(onfulfilled, onrejected);
        } else {
            return this._getInnerPromise()
                .then(onfulfilled, onrejected);
        }
    }

    private async _getInnerPromise(): Promise<T> {
        const startTime = Date.now();
        this.#currentDelay = this.startDelay;
        this.#success = false;
        this.#totalDuration = 0;
        while (!this.isSuccessful && this.totalAttempts < this.maxAttempts && this.totalDuration < this.maxDuration) {
            this.#result = await Promise.resolve()
                .then(this.retryable)
                .catch((e) => {
                    this.#err = e;
                    return undefined;
                });

            this.#success = await this.isConditionMet(this.result);
            if (!this.isSuccessful) {
                if (this.failAction) {
                    await Promise.resolve()
                        .then(this.failAction)
                        .catch(() => {
                            /* ignore */
                        });
                }
                await wait.forDuration(this.currentDelay);
            }
            this.#totalAttempts++;
            this.#currentDelay = Retry.calculateBackOffDelay(this.startDelay, this.currentDelay, this.backOffType);
            this.#totalDuration = convert.toElapsedMs(startTime);
        }
        if (!this.isSuccessful && this.reject) {
            return Promise.reject(`unable to get a successful result after ${convert.toHoursMinutesSeconds(this.totalDuration)} over ${this.totalAttempts} attempts`);
        }
        return this.result;
    }
}

export module Retry {
    /**
     * calculates the number of milliseconds to delay between retry attempts using a
     * `RetryBackOffType` to determine if the value should increase and how if so
     * @param startDelayMs the number of milliseconds delay at the start
     * @param currentDelayMs the number of milliseconds delay last used
     * @param retryType the `RetryBackOffType` delay type to use
     * @returns the number of milliseconds to delay next time
     */
    export function calculateBackOffDelay(startDelayMs: number, currentDelayMs: number, retryType: RetryBackOffType): number {
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
 * @param retryable the function to be retried until it passes a default
 * condition of return value != null or a custom `condition`
 * @returns a new `Retry<T>` instance
 */
export const retry = <T>(retryable: Func<void, T | PromiseLike<T>>): Retry<T> => {
    return new Retry<T>(retryable);
};