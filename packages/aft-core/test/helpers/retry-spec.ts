import { RetryBackOffType } from "../../src";
import { convert } from "../../src/helpers/convert";
import { retry } from "../../src/helpers/retry";

describe('Retry', () => {
    it('can delay by specified number of milliseconds and delay type constant', async () => {
        const now: number = Date.now();
        let result: number = 0;

        await retry.untilTrue(() => {
            result += 1;
            return result > 2;
        }, 100, 'constant');

        let elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(3);
        expect(elapsed).toBeLessThan(500);
        expect(result).toEqual(3);
    });
    
    it('can use a linearly increasing back-off delay', async () => {
        const now: number = Date.now();
        let result: number = 0;
        await retry.untilTrue(() => {
            result += 1;
            return result > 9;
        }, 10, 'linear');

        const elapsed: number = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(500);
        expect(elapsed).toBeLessThan(1000);
        expect(result).toEqual(10);
    });

    it('can use an exponentially increasing back-off delay', async () => {
        const now = Date.now();
        let actual: number = 0;
        await retry.untilTrue(() => {
            actual += 1;
            return actual > 5;
        }, 10, 'exponential');

        const elapsed = convert.toElapsedMs(now);
        expect(elapsed).toBeGreaterThan(600);
        expect(elapsed).toBeLessThan(1000);
        expect(actual).toEqual(6);
    });

    it('can handle a rejected promise in the passed in func', async () => {
        let result = 0;
        const trueResult = await retry.untilTrue(() => {
            result += 1;
            if (result === 1) {
                return Promise.reject('fake error');
            }
            return result > 1;
        }, 1);

        expect(result).toEqual(2);
        expect(trueResult).toBe(true);
    });

    it('can handle exceptions in the failure action on each failed attempt', async () => {
        let result: number = 0;
        await retry.untilTrue(() => {
            result += 1;
            if (result === 1) {
                throw new Error('fake error');
            }
            return result > 1;
        }, 200);

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
            expect(retry.calculateBackOffDelay(d.start, d.current, d.type)).toEqual(d.exp);
        });
    }
});