import { rand } from "../../src/helpers/rand";

describe('RandomGenerator tests', () => {
    describe('getString', () => {
        it('can generate a random string of alpha only characters', () => {
            let actual: string = rand.getString(10);
            expect(actual).not.toBeNull();
            expect(actual).not.toBeUndefined();
            expect(actual.length).toBe(10);
            expect(actual).toMatch(/[A-Z]/);
        });

        it('can generate a random string of numeric only characters', () => {
            let actual: string = rand.getString(15, false, true);
            expect(actual).not.toBeNull();
            expect(actual).not.toBeUndefined();
            expect(actual.length).toBe(15);
            expect(actual).toMatch(/[0-9]/);
        });

        it('can generate a random string of special only characters', () => {
            let actual: string = rand.getString(12, false, false, true);
            expect(actual).not.toBeNull();
            expect(actual).not.toBeUndefined();
            expect(actual.length).toBe(12);
            expect(actual).toMatch(/[\!£\$%\^&*\(\)_+=-\[\];'#,\.\/\{\}:@~<>\?]/);
        });

        it('can generate a random string of extended only characters', () => {
            let actual: string = rand.getString(12, false, false, false, true);
            expect(actual).not.toBeNull();
            expect(actual).not.toBeUndefined();
            expect(actual.length).toBe(12);
            expect(actual).toMatch(/[ÀÁÂÃÄÅĀƁƂÇĈĊĎĐÈÉÊËƑĜĞĠĤĦÌÍÎÏĴĶĹĿŁÑŃÒÓÔÕÖƤɊŔŖŚŜŢŤŦÙÚÛÜŴŶŽ]/);
        });
    });

    describe('getInt', () => {
        it('can generate an integer between min (inclusive) and max (exclusive)', () => {
            for (var i=0; i<1000; i++) {
                let int: number = rand.getInt(0, 2);
                expect(int).toBeLessThan(2);
                expect(int).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('getFrom', () => {
        it('can return a randomly selected object from an array of objects', () => {
            const results = new Map<string, boolean>();
            for (var i=0; i<1000; i++) {
                let str: string = rand.getFrom<string>('foo', 'bar', 'baz');
                results.set(str, true);
            }
            expect(results.size).toBeGreaterThan(1);
        });
    });
});