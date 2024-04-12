import { AftConfig, RetryBackOffType, retry, Retry } from "../../src";
import { convert } from "../../src/helpers/convert";

describe('Retry', () => {
    it('works without passing in any options', async () => {
        let i = 0;
        const actual = await retry(() => i++).until(i => i > 10);

        expect(actual).toEqual(11);
    });

    it('can delay by specified number of milliseconds and delay type constant', async () => {
        const now: number = Date.now();
        let result: number = 0;

        const actual = await new Retry(() => ++result)
            .withDelay(100)
            .withBackOffType('constant')
            .until((res: number) => res > 2);

        const elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(3);
        expect(elapsed).toBeLessThan(500);
        expect(result).toEqual(3);
        expect(actual).toEqual(result);
    });
    
    it('can use a linearly increasing back-off delay', async () => {
        const now: number = Date.now();
        let result: number = 0;
        await retry(() => ++result, {
            delay: 10,
            backOffType: 'linear'
        }).until(res => res === 10);

        const elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(450);
        expect(elapsed).toBeLessThan(1000);
        expect(result).toEqual(10);
    });

    it('can use an exponentially increasing back-off delay', async () => {
        const now = Date.now();
        let actual: number = 0;
        await new Retry(() => {
            actual += 1;
            return actual > 5;
        }, new AftConfig({
            RetryConfig: {
                delay: 10,
                backOffType: 'exponential'
            }
        })).until((res: boolean) => res);

        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(300);
        expect(elapsed).toBeLessThan(1000);
        expect(actual).toEqual(6);
    });

    it('can set a maximum number of attempts', async () => {
        const now = Date.now();
        let attempts: number = 0;
        const actual = await retry(() => ++attempts, {
                maxAttempts: 10,
                errorOnFail: false
        }).until((res: number) => res > 100);

        expect(attempts).toEqual(10);
        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeLessThan(1000);
        expect(actual).toEqual(10);
    });

    it('can set a maximum duration to run', async () => {
        const now = Date.now();
        let attempts: number = 0;
        const aftCfg = new AftConfig({
            RetryConfig: {
                delay: 100,
                backOffType: 'constant',
                maxDuration: 500,
                errorOnFail: false,
            }
        });
        const r = new Retry(() => ++attempts, aftCfg);
        await r.until((res: number) => res > Infinity);

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
        const r = new Retry(() => ++attempts, new AftConfig({
            RetryConfig: {
                maxAttempts: 100
            }
        }));
        try {
            await r.until((res: number) => res > Infinity);
        } catch(e) {
            errStr = e;
        }

        expect(errStr).toBeDefined();
        expect(errStr).toMatch('over 100 attempts');
        expect(r.result).toEqual(100);
        expect(r.isSuccessful).toBe(false);
    });

    it('can handle rejected promises', async () => {
        let result = 0;
        const actual = await retry(() => {
            result++;
            if (result === 1) {
                return Promise.reject('fake error');
            }
            return result > 1;
        }, {
            delay: 1,
            failAction: () => Promise.reject('fake fail action error')
        }).start();
        

        expect(result).toEqual(2);
        expect(actual).toBeTrue();
    });

    it('can handle exceptions', async () => {
        let result: number = 0;
        const actual = await retry(() => {
            result += 1;
            if (result === 1) {
                throw new Error('fake error');
            }
            return result > 1;
        }, {
            delay: 200,
            failAction: () => {throw new Error('fake fail action error');}
        }).start();

        expect(result).toEqual(2);
        expect(actual).toBeTrue();
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