import { rand, TestException } from "../../../src";

describe('TestException', () => {
    it('exposes the original Error', () => {
        const err: Error = new Error(rand.getString(25));

        const actual: TestException = new TestException(err);

        expect(actual.err).toBeDefined();
        expect(actual.err.message).toEqual(err.message);
    });
    
    it('can generate a shortened string', () => {
        const err: Error = new Error(rand.getString(1000, true, true, true, true));

        const actual: string = TestException.short(err);

        expect(actual.length).toBeLessThan(300);
    });

    it('can generate a full Error string', () => {
        const err: Error = new Error(rand.getString(500, true, true, true, true));

        const actual: string = TestException.full(err);

        expect(actual.length).toBeGreaterThan(500);
    });

    it('can handle null argument to contstuctor', () => {
        const actual: string = TestException.full(null);

        expect(actual).toEqual('undefined: undefined --- undefined');
    });
});