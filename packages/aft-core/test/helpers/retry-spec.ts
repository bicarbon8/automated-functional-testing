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
        await retry.untilTrue(() => {
            result += 1;
            if (result === 1) {
                return Promise.reject('fake error');
            }
            return result > 1;
        }, 1);

        expect(result).toEqual(2);
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
});