import { Err } from "./err";
import { convert } from "./convert";
import { Func } from "./custom-types";

class Wait {
    /**
     * function will execute an asynchronous action and await a result repeating execution every 1 millisecond until a 
     * result of 'true' is returned or the 'msDuration' specified has elapsed. If the action never returns 'true' and 
     * the 'msDuration' elapses, an Error will be thrown by way of a Promise.reject
     * @param condition an asynchronous action that should be executed until it returns 'true' or the 'msDuration' has expired
     * @param msDuration the maximum amount of time to wait for the 'condition' to return 'true'
     * @param onFailAction an action to perform on each attempt resulting in failure ('Error' or 'false') of the 'condition'
     */
    async untilTrue(condition: Func<void, boolean | PromiseLike<boolean>>, msDuration: number, onFailAction?: Func<void, any>) : Promise<void> {
        let result: boolean = false;
        let attempts: number = 0;
        const startTime: number = new Date().getTime();
        let err: Error;

        do {
            attempts++;
            result = await Promise.resolve()
            .then(condition)
            .catch((e) => {
                err = e;
                return false;
            });
            
            if (!result) {
                if (onFailAction) {
                    await Promise.resolve()
                    .then(onFailAction)
                    .catch((err) => {
                        /* ignore */
                    });
                }
            }
            await this.forDuration(1);
        } while (result !== true && convert.toElapsedMs(startTime) < msDuration);

        if (result) {
            return Promise.resolve();
        }
            
        return Promise.reject(`wait.untilTrue(...) exceeded [${convert.toHoursMinutesSeconds(msDuration)}] over '${attempts}' attempts without returning 'true'${(err) ? ` due to: ${Err.short(err)}` : ''}`);
    }

    /**
     * function will wait for the specified amount of time
     * @param msDuration the amount of time to wait before resuming
     */
    async forDuration(msDuration: number): Promise<void> {
        return new Promise((resolve) => {
            setTimeout(resolve, msDuration);
        });
    }
}

export const wait = new Wait();