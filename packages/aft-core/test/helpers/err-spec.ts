import { rand, Err, LogManager } from "../../src";

describe('Err', () => {
    it('exposes the original Error', () => {
        const err: Error = new Error(rand.getString(25));

        const actual = new Err(err);

        expect(actual.err).toBeDefined();
        expect(actual.err.message).toEqual(err.message);
    });
    
    it('can generate a shortened string', () => {
        const err: Error = new Error(rand.getString(1000, true, true, true, true));

        const actual: string = Err.short(err);

        expect(actual.length).toBeLessThan(450);
    });

    it('can generate a full Error string', () => {
        const err: Error = new Error(rand.getString(500, true, true, true, true));

        const actual: string = Err.full(err);

        expect(actual.length).toBeGreaterThan(500);
    });

    it('can handle null argument to contstuctor', () => {
        const actual: string = Err.full(null);

        expect(actual).toEqual('undefined: undefined --- undefined');
    });

    it('can handle try-catch for a Func<void, any> that does not throw', async () => {
        const func = function () { return 'foo'; };
        const val = await Err.handle(func);

        expect(val).toEqual('foo');
    });

    it('can handle try-catch for a Func<void, any> that throws', async () => {
        const func = function () { throw 'foo'; };
        const val = await Err.handle(func);

        expect(val).toBeNull();
    });

    it('can handle try-catch for a Func<void, any> that rejects a Promise', async () => {
        const func = () => Promise.reject('foo');
        const val = await Err.handle(func);

        expect(val).toBeNull();
    });

    it('will log a warning if a LogManager is supplied and the Func throws', async () => {
        const logMgr = new LogManager({logName: 'will log a warning if a LogManager is supplied and the Func throws', plugins: []});
        let logMessage: string;
        spyOn(logMgr, 'warn').and.callFake((message: string) => {
            logMessage = message;
            return Promise.resolve();
        });
        const func = function () { throw 'foo'; };
        const val = await Err.handle(func, logMgr);

        expect(val).toBeNull();
        expect(logMgr.warn).toHaveBeenCalledTimes(1);
        expect(logMessage).toContain('Error: foo ');
    });
});