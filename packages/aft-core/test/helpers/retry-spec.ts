import { AftConfig, RetryBackOffType, retry, Retry } from "../../src";
import { convert } from "../../src/helpers/convert";

describe('Retry', () => {
    it('can delay by specified number of milliseconds and delay type constant', async () => {
        const now: number = Date.now();
        let result: number = 0;

        await retry(() => ++result, new AftConfig({
            retryDelayMs: 100,
            retryBackOffType: 'constant'
        })).until((res: number) => res > 2);

        let elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(3);
        expect(elapsed).toBeLessThan(500);
        expect(result).toEqual(3);
    });
    
    it('can use a linearly increasing back-off delay', async () => {
        const now: number = Date.now();
        let result: number = 0;
        await retry(() => ++result, new AftConfig({
            retryDelayMs: 10,
            retryBackOffType: 'linear'
        })).until((res: number) => res > 9);

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
        }, new AftConfig({
            retryDelayMs: 10,
            retryBackOffType: 'exponential'
        })).until((res: boolean) => res);

        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(300);
        expect(elapsed).toBeLessThan(1000);
        expect(actual).toEqual(6);
    });

    it('can set a maximum number of attempts', async () => {
        const now = Date.now();
        let attempts: number = 0;
        await retry(() => ++attempts, new AftConfig({
            retryMaxAttempts: 10,
            retryRejectOnFail: false
        })).until((res: number) => res > 100);

        expect(attempts).toEqual(10);
        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeLessThan(1000);
    });

    it('can set a maximum duration to run', async () => {
        const now = Date.now();
        let attempts: number = 0;
        const aftCfg = new AftConfig({
            retryDelayMs: 100,
            retryBackOffType: 'constant',
            retryMaxDurationMs: 500,
            retryRejectOnFail: false,
        });
        const r = retry(() => ++attempts, aftCfg)
            .until((res: number) => res > Infinity);
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
        const r = retry(() => ++attempts, new AftConfig({
            retryMaxAttempts: 100
        })).until((res: number) => res > Infinity);
        await Promise.resolve(r).catch((err) => errStr = err);

        expect(errStr).toBeDefined();
        expect(errStr).toContain('over 100 attempts');
        expect(r.result).toEqual(100);
        expect(r.isSuccessful).toBe(false);
    });

    it('can handle rejected promises', async () => {
        let result = 0;
        const trueResult = await retry(() => {
            result += 1;
            if (result === 1) {
                return Promise.reject('fake error');
            }
            return result > 1;
        }, new AftConfig({
            retryDelayMs: 1
        })).until((res: boolean) => res)
        .withFailAction(() => Promise.reject('fake fail action error'));

        expect(result).toEqual(2);
        expect(trueResult).toBe(true);
    });

    it('can handle exceptions', async () => {
        let result: number = 0;
        await retry(() => {
            result += 1;
            if (result === 1) {
                throw new Error('fake error');
            }
            return result > 1;
        }, new AftConfig({
            retryDelayMs: 200
        })).until((res: boolean) => res)
        .withFailAction(() => {throw new Error('fake fail action error');});

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