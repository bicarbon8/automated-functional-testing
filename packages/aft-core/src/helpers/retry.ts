import { Func } from "./custom-types";
import { wait } from "./wait";

class Retry {
    /**
     * function will execute an asynchronous action and await a result repeating execution every 1 millisecond until a 
     * result of 'true' is returned or the 'msDuration' specified has elapsed. If the action never returns 'true' and 
     * the 'msDuration' elapses, an Error will be thrown by way of a Promise.reject
     * @param func an asynchronous action that should be executed until it returns 'true'
     * @param onFailAction an action to perform on each attempt resulting in failure ('Error' or 'false') of the 'condition'
     */
    async untilTrue(func: Func<void, boolean | PromiseLike<boolean>>, delayBetweenAttempts: number = 1000, onFailAction?: Func<void, any>) : Promise<boolean> {
        let result: boolean = false;
        let attempts: number = 0;
        let err: Error;

        do {
            attempts++;
            result = await Promise.resolve()
            .then(func)
            .catch((e) => {
                err = e;
                return false;
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
                await wait.forDuration(delayBetweenAttempts);
            }
        } while (result !== true);
        return false;
    }
}

export const retry = new Retry();