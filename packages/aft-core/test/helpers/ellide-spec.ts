import { EllipsisLocation, ellide, rand } from "../../src";

describe('ellide', () => {
    it('returns the original string if less than specified length', () => {
        const original: string = rand.getStringFrom(50, rand.ALPHAS + ' ');

        const actual: string = ellide(original, 100);

        expect(actual.length).withContext('no change to actual length from original').toBe(original.length);
        expect(actual).withContext('original string is unchanged').toEqual(original);
    });

    it('adds ellipsis at the end of a string by default', () => {
        const original: string = rand.getStringFrom(100, rand.ALPHAS + ' ');

        const actual: string = ellide(original, 50);

        expect(actual.length).withContext('length should be as specified by finalLength argument').toBe(50);
        expect(actual.slice(0, 47)).withContext('first part of string should match').toEqual(original.slice(0, 47));
        expect(actual.slice(47, 50)).withContext('ellipsis should be end').toEqual('...');
    });

    it('can override ellipsis at the end of a string', () => {
        const original: string = rand.getStringFrom(100, rand.ALPHAS + ' ');

        const actual: string = ellide(original, 50, 'end', '.....');

        expect(actual.length).withContext('length should be as specified by finalLength argument').toBe(50);
        expect(actual.slice(0, 45)).withContext('first part of string should match').toEqual(original.slice(0, 45));
        expect(actual.slice(45, 50)).withContext('ellipsis should be end').toEqual('.....');
    });

    it('can add ellipsis at the beginning', () => {
        const original: string = rand.getStringFrom(100, rand.ALPHAS + ' ');

        const actual: string = ellide(original, 50, 'beginning');

        expect(actual.length).withContext('length should be as specified by finalLength argument').toBe(50);
        expect(actual.slice(0, 3)).withContext('ellipsis should be at beginning').toEqual('...');
        expect(actual.slice(3, 50)).withContext('last part of string should match').toEqual(original.slice(53, 100));
    });

    it('can add ellipsis in the middle', () => {
        const original: string = rand.getStringFrom(100, rand.ALPHAS + ' ');

        const actual: string = ellide(original, 50, 'middle');

        expect(actual.length).withContext('length should be as specified by finalLength argument').toBe(50);
        expect(actual).withContext('ellipsis should be in the middle').toContain('...');
        expect(actual.slice(0, 15)).withContext('first part of string should match').toEqual(original.slice(0, 15));
        expect(actual.slice(35, 50)).withContext('last part of string should match').toEqual(original.slice(85, 100));
    });

    const data = [
        {input: 'the quick brown fox jumped over the lazy dogs', length: 10, location: undefined, ellipsis: undefined, expected: 'the qui...'},
        {input: 'the quick brown fox jumped over the lazy dogs', length: 10, location: 'beginning', ellipsis: undefined, expected: '...zy dogs'},
        {input: 'the quick brown fox jumped over the lazy dogs', length: 10, location: 'middle', ellipsis: undefined, expected: 'the...dogs'},
        {input: 'the quick brown fox jumped over the lazy dogs', length: 10, location: 'end', ellipsis: '_', expected: 'the quick_'},
    ];
    for (const d of data) {
        it(`can process as expected: ${JSON.stringify(d)}`, () => {
            expect(ellide(d.input, d.length, d.location as EllipsisLocation, d.ellipsis)).toEqual(d.expected);
        });
    }
});
