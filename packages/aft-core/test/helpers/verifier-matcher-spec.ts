import { between, containing, Equaling, exactly, not } from "../../src/helpers/verifier-matcher";

describe('VerifierMatcher', () => {
    describe('Equaling', () => {
        let testData = [
            {expected: 100, actual: 100, result: true},
            {expected: 'foo', actual: 'foo', result: true},
            {expected: null, actual: null, result: true},
            {expected: undefined, actual: undefined, result: true},
            {expected: 'foo', actual: 'bar', result: false},
            {expected: 100, actual: 2, result: false},
            {expected: 9, actual: '9', result: true},
            {expected: 0, actual: false, result: true},
            {expected: 1, actual: true, result: true},
            {expected: 'foo', actual: true, result: false},
            {expected: undefined, actual: false, result: false},
            {expected: null, actual: false, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                let m = new Equaling(data.expected);
                m.actual = data.actual;
                expect(m.compare()).toBe(data.result);
            });
        });
    });

    describe('Exactly', () => {
        let testData = [
            {expected: 100, actual: 100, result: true},
            {expected: 'foo', actual: 'foo', result: true},
            {expected: null, actual: null, result: true},
            {expected: undefined, actual: undefined, result: true},
            {expected: 'foo', actual: 'bar', result: false},
            {expected: 100, actual: 2, result: false},
            {expected: 9, actual: '9', result: false},
            {expected: 0, actual: false, result: false},
            {expected: 1, actual: true, result: false},
            {expected: 'foo', actual: true, result: false},
            {expected: undefined, actual: false, result: false},
            {expected: null, actual: false, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                let m = exactly(data.expected);
                m.actual = data.actual;
                expect(m.compare()).toBe(data.result);
            });
        });
    });

    describe('NumberBetween', () => {
        let testData = [
            {min: 0, max: 100, actual: 100, result: true},
            {min: 0, max: 100, actual: 0, result: true},
            {min: 0, max: 9, actual: 10, result: false},
            {min: 0, max: 1, actual: -1, result: false},
            {min: 0, max: 1, actual: 0.5, result: true},
            {min: 0, max: 1, actual: 1.0001, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                let m = between(data.min, data.max);
                m.actual = data.actual;
                expect(m.compare()).toBe(data.result);
            });
        });
    });

    describe('ValueContaining', () => {
        let testData = [
            {expected: 'foo', actual: 'foo', result: true},
            {expected: null, actual: null, result: false},
            {expected: undefined, actual: undefined, result: false},
            {expected: null, actual: 'null', result: false},
            {expected: undefined, actual: 'undefined', result: false},
            {expected: 'null', actual: null, result: false},
            {expected: 'undefined', actual: undefined, result: false},
            {expected: 'bar', actual: 'foo', result: false},
            {expected: 'f', actual: 'foo', result: true},
            {expected: 'foo', actual: 'foo', result: true},
            {expected: '1', actual: 'foo', result: false},
            {expected: 'a', actual: 'foo', result: false},
            {expected: 'foo', actual: ['foo'], result: true},
            {expected: 'bar', actual: ['foo'], result: false},
            {expected: 'foo', actual: [], result: false},
            {expected: null, actual: [null], result: true},
            {expected: undefined, actual: [undefined], result: true},
            {expected: 'foo', actual: new Set<string>(['foo']), result: true},
            {expected: 'bar', actual: new Set<string>(['foo']), result: false},
            {expected: 'foo', actual: new Set<string>(), result: false},
            {expected: null, actual: new Set<string>([null]), result: true},
            {expected: 'foo', actual: new Map<string, string>([['foo','bar']]), result: true},
            {expected: 'bar', actual: new Map<string, string>([['foo','bar']]), result: false},
            {expected: 'foo', actual: new Map<string, string>(), result: false},
            {expected: null, actual: new Map<string, string>([[null, 'bar']]), result: true},
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                let m = containing(data.expected);
                m.actual = data.actual;
                expect(m.compare()).toBe(data.result);
            });
        });
    });

    describe('Negate', () => {
        let testData = [
            {expected: containing('foo'), actual: 'foo', result: false},
            {expected: containing(null), actual: null, result: true},
            {expected: containing(undefined), actual: undefined, result: true},
            {expected: containing(null), actual: 'null', result: true},
            {expected: containing(undefined), actual: 'undefined', result: true},
            {expected: containing('null'), actual: null, result: true},
            {expected: containing('undefined'), actual: undefined, result: true},
            {expected: containing('bar'), actual: 'foo', result: true},
            {expected: containing('f'), actual: 'foo', result: false},
            {expected: containing('foo'), actual: 'foo', result: false},
            {expected: containing('1'), actual: 'foo', result: true},
            {expected: containing('a'), actual: 'foo', result: true},
            {expected: containing('foo'), actual: ['foo'], result: false},
            {expected: containing('bar'), actual: ['foo'], result: true},
            {expected: containing('foo'), actual: [], result: true},
            {expected: containing(null), actual: [null], result: false},
            {expected: containing(undefined), actual: [undefined], result: false},
            {expected: containing('foo'), actual: new Set<string>(['foo']), result: false},
            {expected: containing('bar'), actual: new Set<string>(['foo']), result: true},
            {expected: containing('foo'), actual: new Set<string>(), result: true},
            {expected: containing(null), actual: new Set<string>([null]), result: false},
            {expected: containing('foo'), actual: new Map<string, string>([['foo','bar']]), result: false},
            {expected: containing('bar'), actual: new Map<string, string>([['foo','bar']]), result: true},
            {expected: containing('foo'), actual: new Map<string, string>(), result: true},
            {expected: containing(null), actual: new Map<string, string>([[null, 'bar']]), result: false},
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                let m = not(data.expected);
                m.actual = data.actual;
                expect(m.compare()).toBe(data.result);
            });
        });
    });
});