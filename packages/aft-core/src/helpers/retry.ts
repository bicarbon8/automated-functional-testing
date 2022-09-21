import { Func, RetryBackOffType } from "./custom-types";
import { wait } from "./wait";

class Retry {
    /**
     * function will execute an asynchronous action and await a result repeating execution every 1 millisecond until a 
     * result of 'true' is returned or the 'msDuration' specified has elapsed. If the action never returns 'true' and 
     * the 'msDuration' elapses, an Error will be thrown by way of a Promise.reject
     * @param func an asynchronous action that should be executed until it returns 'true'
     * @param delayMs the number of milliseconds to wait between retries or a 'Delay' object indicating retry falloff
     * @param onFailAction an action to perform on each attempt resulting in failure ('Error' or 'false') of the 'condition'
     */
    async untilTrue(func: Func<void, boolean | PromiseLike<boolean>>, delayMs: number = 1000, delayType: RetryBackOffType = 'constant', onFailAction?: Func<void, any>) : Promise<boolean> {
        const startDelayMs = delayMs;
        let result: boolean;
        let attempts: number = 0;
        let err: Error;

        do {
            attempts++;
            result = await Promise.resolve()
                .then(func)
                .catch((e) => {
                    err = e;
                    return null;
                });

            if (result) {
                return result;
            } else {
                if (onFailAction) {
                    await Promise.resolve()
                        .then(onFailAction)
                        .catch((err) => {
                            /* ignore */
                        });
                }
                delayMs = this.calculateBackOffDelay(startDelayMs, delayMs, delayType);
                await wait.forDuration(delayMs);
            }
        } while (!result);
        return false;
    }

    /**
     * function will execute a passed in `Func<void, T | PromiseLike<T>>` and await a result, repeating execution at the passed
     * in `delayMs` interval (using the specified `delayType` back-off) until it returns a non-nullish value
     * @param func a synchronous or async action that should be executed until it returns a value other than `null` or `undefined`
     * @param delayMs the number of milliseconds to wait between calls to `func` (defaults to 1 sec)
     * @param delayType the type of retry back-off to use (defaults to constant)
     * @param onFailAction an action to perform on each attempt that either throws an error or returns `null` or `undefined`
     * @returns 
     */
    async untilResult<T>(func: Func<void, T | PromiseLike<T>>, delayMs: number = 1000, delayType: RetryBackOffType = 'constant', onFailAction?: Func<void, any>): Promise<T> {
        const startDelayMs = delayMs;
        let result: T;
        let attempts: number = 0;
        let err: Error;

        do {
            attempts++;
            result = await Promise.resolve()
                .then(func)
                .catch((e) => {
                    err = e;
                    return null;
                });

            if (result != null) {
                return result;
            } else {
                if (onFailAction) {
                    await Promise.resolve()
                        .then(onFailAction)
                        .catch((err) => {
                            /* ignore */
                        });
                }
                delayMs = this.calculateBackOffDelay(startDelayMs, delayMs, delayType);
                await wait.forDuration(delayMs);
            }
        } while (result == null);
        return null;
    }

    calculateBackOffDelay(startDelayMs: number, currentDelayMs: number, retryType: RetryBackOffType): number {
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

export const retry = new Retry();