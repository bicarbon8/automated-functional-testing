import { Func, RetryBackOffType } from "./custom-types";
import { wait } from "./wait";

/**
 * function will execute a passed in `Func<void, T | PromiseLike<T>>` and await a result, repeating execution at the passed
 * in `delay` interval (using the specified `backOffType` back-off) until the `condition` succeeds (returns `true`)
 */
export class Retry<T> implements PromiseLike<T> {
    #retryable: Func<void, T | PromiseLike<T>>;
    #delay: number;
    #currentDelay: number;
    #backOffType: RetryBackOffType;
    #condition: Func<T, boolean | PromiseLike<boolean>>;
    #maxAttempts: number;
    #totalAttempts: number;
    #failAction: Func<void, any>;
    #err: any;

    constructor(retryable: Func<void, T | PromiseLike<T>>) {
        this.#retryable = retryable;
        this.#delay = 1;
        this.#currentDelay = this.#delay;
        this.#backOffType = 'constant';
        this.#maxAttempts = Infinity;
        this.#totalAttempts = 0;
        this.#condition = (result: T) => result != null;
    }

    get retryable(): Func<void, T | PromiseLike<T>> {
        return this.#retryable;
    }

    get startDelay(): number {
        return this.#delay;
    }

    get currentDelay(): number {
        return this.#currentDelay;
    }

    get backOffType(): RetryBackOffType {
        return this.#backOffType;
    }

    get condition(): Func<T, boolean | PromiseLike<boolean>> {
        return this.#condition;
    }

    get maxAttempts(): number {
        return this.#maxAttempts;
    }

    get totalAttempts(): number {
        return this.#totalAttempts;
    }

    get failAction(): Func<void, any> {
        return this.#failAction;
    }

    get lastError(): any {
        return this.#err;
    }

    withStartDelayBetweenAttempts(delayMs: number): this {
        this.#delay = delayMs;
        return this;
    }

    withBackOff(backOffType: RetryBackOffType): this {
        this.#backOffType = backOffType;
        return this;
    }

    until(func: Func<T, boolean | PromiseLike<boolean>>): this {
        this.#condition = func;
        return this;
    }

    withMaxAttempts(maxAttempts: number): this {
        this.#maxAttempts = maxAttempts;
        return this;
    }

    withFailAction(func: Func<void, any>): this {
        this.#failAction = func;
        return this;
    }

    async isConditionMet(result: T): Promise<boolean> {
        return Promise.resolve(this.condition(result));
    }
    
    async then<TResult1, TResult2 = never>(onfulfilled?: (value: T) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        return this._getInnerPromise()
            .then(onfulfilled, onrejected);
    }

    private async _getInnerPromise(): Promise<T> {
        let result: T;
        this.#currentDelay = this.startDelay;
        let success = false;
        while (!success && this.#totalAttempts < this.#maxAttempts) {
            result = await Promise.resolve()
                .then(this.retryable)
                .catch((e) => {
                    this.#err = e;
                    return null;
                });

            success = await this.isConditionMet(result);
            if (!success) {
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
        }
        return result;
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
 * generates a new `Retry` instance that runs a given `retryable` until it
 * successfully passes a `condition`
 * @param retryable the function to be retried until it passes a default
 * condition of return value != null or a custom `condition`
 * @returns a `Retry` instance
 */
export const retry = <T>(retryable: Func<void, T | PromiseLike<T>>): Retry<T> => {
    return new Retry<T>(retryable);
};