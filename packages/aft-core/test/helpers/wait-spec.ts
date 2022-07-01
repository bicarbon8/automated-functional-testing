import { convert } from "../../src/helpers/convert";
import { wait } from "../../src/helpers/wait";

describe('Wait', () => {
    beforeEach(() => {
        TestHelper.reset();
    });

    it('can wait for a less than the maximum duration if action returns true', async () => {
        let now: number = new Date().getTime();
        
        await wait.untilTrue(async () => {
            // wait 1 ms and return false 2 times, then true
            await new Promise<void>((resolve) => {
                setTimeout(resolve, 1);
            });
            TestHelper.count += 1;
            return TestHelper.count > 2;
        }, 2000);

        let elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(3);
        expect(elapsed).toBeLessThan(2000);
        expect(TestHelper.count).toEqual(3);
    });
    
    it('will emit a rejected promise if duration is exceeded without returning true', async () => {
        const now: number = new Date().getTime();
        let actualErr: any;
        await wait.untilTrue(async () => {
            TestHelper.count += 1;
            return false;
        }, 200).catch((err) => {
            actualErr = err;
        });

        const elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThanOrEqual(200);
        expect(elapsed).toBeLessThan(1000);
        expect(TestHelper.count).toBeGreaterThan(10);
        expect(actualErr).toEqual(`wait.untilTrue(...) exceeded [${convert.toHoursMinutesSeconds(200)}] over '${TestHelper.count}' attempts without returning 'true'`);
    });

    it('can execute a failure action on each failed attempt', async () => {
        let actual: number = 0;
        await wait.untilTrue(() => {throw new Error('fake error');}, 200, async () => {
            actual++;
            await wait.forDuration(50);
        }).catch((err) => {/* do nothing */});

        expect(actual).toBeGreaterThan(1);
    });

    it('can handle a rejected promise in the passed in func', async () => {
        let actualErr: any;
        await wait.untilTrue(() => Promise.reject('fake error'), 200)
        .catch((err) => actualErr = err);

        expect(actualErr).toContain('fake error');
    });

    it('can handle exceptions in the failure action on each failed attempt', async () => {
        let actual: number = 0;
        await wait.untilTrue(() => {throw new Error('fake error');}, 200, async () => {
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