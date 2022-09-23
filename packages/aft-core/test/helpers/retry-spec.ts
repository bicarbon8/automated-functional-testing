import { RetryBackOffType } from "../../src";
import { convert } from "../../src/helpers/convert";
import { Retry, retry } from "../../src/helpers/retry";

describe('Retry', () => {
    it('can delay by specified number of milliseconds and delay type constant', async () => {
        const now: number = Date.now();
        let result: number = 0;

        await retry(() => ++result)
            .until((res: number) => res > 2)
            .withStartDelayBetweenAttempts(100)
            .withBackOff('constant');

        let elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(3);
        expect(elapsed).toBeLessThan(500);
        expect(result).toEqual(3);
    });
    
    it('can use a linearly increasing back-off delay', async () => {
        const now: number = Date.now();
        let result: number = 0;
        await retry(() => ++result)
            .until((res: number) => res > 9)
            .withStartDelayBetweenAttempts(10)
            .withBackOff('linear');

        const elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(450);
        expect(elapsed).toBeLessThan(1000);
        expect(result).toEqual(10);
    });

    it('can use an exponentially increasing back-off delay', async () => {
        const now = Date.now();
        let actual: number = 0;
        await retry(() => {
            actual += 1;
            return actual > 5;
        })
        .until((res: boolean) => res)
        .withStartDelayBetweenAttempts(10)
        .withBackOff('exponential');

        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(300);
        expect(elapsed).toBeLessThan(1000);
        expect(actual).toEqual(6);
    });

    it('can set a maximum number of attempts', async () => {
        const now = Date.now();
        let attempts: number = 0;
        await retry(() => ++attempts)
            .until((res: number) => res > 100)
            .withMaxAttempts(10)
            .rejectIfUnsuccessful(false);

        expect(attempts).toEqual(10);
        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeLessThan(1000);
    });

    it('can set a maximum duration to run', async () => {
        const now = Date.now();
        let attempts: number = 0;
        const r = retry(() => ++attempts)
            .until((res: number) => res > Infinity)
            .withStartDelayBetweenAttempts(100)
            .withBackOff('constant')
            .withMaxDuration(500)
            .rejectIfUnsuccessful(false);
        await Promise.resolve(r);

        const elapsed = convert.toElapsedMs(now);
        expect(attempts).toBeGreaterThan(3);
        expect(r.totalAttempts).toBeGreaterThan(3);
        expect(r.totalDuration).toBeGreaterThan(300);
        expect(r.totalDuration).toBeLessThan(700);
        expect(elapsed).toBeLessThan(1000);
    });

    it('returns a rejected promise if max duration or attempts is exceeded before success', async () => {
        let attempts = 0;
        let errStr: string;
        const r = retry(() => ++attempts)
            .until((res: number) => res > Infinity)
            .withMaxAttempts(100);
        await Promise.resolve(r).catch((err) => errStr = err);

        expect(errStr).toBeDefined();
        expect(errStr).toContain('over 100 attempts');
        expect(r.result).toEqual(100);
        expect(r.isSuccessful).toBe(false);
    });

    it('can handle a rejected promise in the passed in func', async () => {
        let result = 0;
        const trueResult = await retry(() => {
            result += 1;
            if (result === 1) {
                return Promise.reject('fake error');
            }
            return result > 1;
        })
        .until((res: boolean) => res)
        .withStartDelayBetweenAttempts(1);

        expect(result).toEqual(2);
        expect(trueResult).toBe(true);
    });

    it('can handle exceptions in the failure action on each failed attempt', async () => {
        let result: number = 0;
        await retry(() => {
            result += 1;
            if (result === 1) {
                throw new Error('fake error');
            }
            return result > 1;
        })
        .until((res: boolean) => res)
        .withStartDelayBetweenAttempts(200);

        expect(result).toEqual(2);
    });

    const data: Array<{start: number, current: number, type: RetryBackOffType, exp: number}> = [
        {start: 10, current: 10, type: 'constant', exp: 10},
        {start: 1000, current: 2000, type: 'linear', exp: 3000},
        {start: 10, current: 1000, type: 'exponential', exp: 2000}
    ];
    for (var i=0; i<data.length; i++) {
        const d = data[i];
        it(`can calculate the next retry back-off delay for: ${JSON.stringify(d)}`, () => {
            expect(Retry.calculateBackOffDelay(d.start, d.current, d.type)).toEqual(d.exp);
        });
    }
});