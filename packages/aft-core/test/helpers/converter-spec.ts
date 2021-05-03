import { convert, rand } from "../../src";

describe('Converter', () => {
    describe('toSafeString', () => {
        it('does not change the passed in string', () => {
            let actual: string = rand.getString(150, true, false, true, false);
            let expected: string = actual;

            convert.toSafeString(actual);

            expect(actual).toEqual(expected);
        });
    });
});