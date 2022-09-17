import { convert } from "../../src/helpers/convert";
import { wait } from "../../src/helpers/wait";

describe('Wait', () => {
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
                // called after `wait` duration times out
                setTimeout(() => resolve(12), 2000);
            });
        }, 500);

        const elapsed: number = convert.toElapsedMs(start);
        expect(result).toBeNull();
        expect(elapsed).toBeLessThan(1000);
    });

    it('allows exceptions in func through', async () => {
        let actualErr: any;
        const result: number = await wait.forResult(() => {throw 'fake error';}, 200)
            .catch((err) => {
                actualErr = err;
                return -1;
            });

        expect(result).toEqual(-1);
        expect(actualErr).toContain('fake error');
    });

    it('allows rejected promises through', async () => {
        const result: number = await wait.forResult(() => Promise.reject('fake rejection'), 200)
            .catch((err) => -1);

        expect(result).toEqual(-1);
    });
});