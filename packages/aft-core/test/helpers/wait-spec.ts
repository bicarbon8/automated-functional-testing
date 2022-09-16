import { convert } from "../../src/helpers/convert";
import { wait } from "../../src/helpers/wait";
import { retry } from "../../src/helpers/retry";

describe('Wait', () => {
    beforeEach(() => {
        TestHelper.reset();
    });

    it('can wait for a less than the maximum duration', async () => {
        let start: number = new Date().getTime();
        
        const result: number = await wait.forResult(() => 12, 500);

        let elapsed: number = convert.toElapsedMs(start);
        expect(result).toEqual(12);
        expect(elapsed).toBeLessThan(500);
    });
    
    it('will return null on timeout', async () => {
        const start: number = new Date().getTime();
        const result: number = await wait.forResult(() => {
            return new Promise((resolve) => {
                setTimeout(() => 12, 2000);
            });
        }, 500);

        const elapsed: number = convert.toElapsedMs(start);
        expect(result).toBeNull();
        expect(elapsed).toBeLessThan(1000);
    });

    it('will return a rejected promise if passed in func throws', async () => {
        let actualErr: any;
        const result: number = await wait.forResult(() => {throw 'fake error';}, 200)
            .catch((err) => actualErr = err);

        expect(actualErr).toContain('fake error');
    });

    it('can handle exceptions in the failure action on each failed attempt', async () => {
        let actual: number = 0;
        await retry.untilTrue(() => {throw new Error('fake error');}, 200, async () => {
            actual++;
            await wait.forDuration(50);
            throw new Error('onFailureAction error');
        }).catch((err) => {/* do nothing */});

        expect(actual).toBeGreaterThan(1);
    });
});

module TestHelper {
    export var count: number = 0;

    export function reset(): void {
        count = 0;
    }
}