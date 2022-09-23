import { Func } from "./custom-types";

class Wait {
    /**
     * function will wait for the specified amount of time
     * @param durationMs the amount of time to wait before resuming
     */
    async forDuration(durationMs: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, durationMs);
        });
    }

    /**
     * waits up to the specified `maxDurationMs` for a result from the passed in `func`
     * @param func a synchronous or async function returning a result of type `T`
     * @param maxDurationMs the maximum amount of time to wait (defaults to 30 seconds)
     * @returns the result of the passed in `func` or `undefined` if the `maxDurationMs` elapses before `func`
     * returns a result
     */
    async forResult<T>(func: Func<void, T | PromiseLike<T>>, maxDurationMs: number = 30000): Promise<T> {
        return await Promise.race([
            Promise.resolve().then(func).catch((err) => Promise.reject(err)),
            new Promise<T>((resolve) => setTimeout(resolve, maxDurationMs, undefined))
        ]);
    }

    /**
     * will wait until the specified time
     * @param time either the time in milliseconds past the epoch or a `Date` object
     * representing the desired time to wait until
     */
    async until(time: number | Date): Promise<void> {
        let t: number;
        if (typeof time === "number") {
            t = time;
        } else {
            t = time.getTime();
        }
        return new Promise(async (resolve) => {
            while (Date.now() < t) {
                await wait.forDuration(1);
            }
            resolve();
        });
    }
}

export const wait = new Wait();