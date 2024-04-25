import { between, containing, equaling, equivalent, exactly, greaterThan, havingProps, havingValue, lessThan, not } from "../../src";

describe('VerifyMatcher', () => {
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
                expect(equaling(data.expected).setActual(data.actual).compare()).toBe(data.result);
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
                expect(exactly(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('EquivalentTo', () => {
        let testData = [
            {expected: {}, actual: {}, result: true},
            {expected: {foo: 'foo'}, actual: {foo: 'foo'}, result: true},
            {expected: {foo: 'foo'}, actual: {foo: 'foo', bar: 'bar'}, result: true},
            {expected: {foo: {foo: 'foo'}}, actual: {foo: {foo: 'foo'}, baz: 'foo'}, result: true},
            {expected: {}, actual: 'foo', result: false},
            {expected: null, actual: null, result: false},
            {expected: {foo: 'foo'}, actual: {foo: 'bar'}, result: false},
            {expected: {foo: 'foo'}, actual: {bar: 'foo'}, result: false},
            {expected: {foo: {foo: 'foo'}}, actual: {foo: {foo: 'bar'}}, result: false},
            {expected: {foo: 'foo', bar: 'bar'}, actual: {bar: 'bar'}, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(equivalent(data.expected).setActual(data.actual).compare()).toBe(data.result);
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
                expect(between(data.min, data.max).setActual(data.actual).compare()).toBe(data.result);
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
            {expected: 'bar', actual: ['foobarbaz'], result: true}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(containing(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('HavingProperties', () => {
        let testData = [
            {expected: {}, actual: {}, result: true},
            {expected: {foo: 'foo'}, actual: {foo: 'bar'}, result: true},
            {expected: {foo: 'foo'}, actual: {foo: 'bar', baz: 'foo'}, result: true},
            {expected: {foo: {foo: 'foo'}}, actual: {foo: {foo: 'bar'}, baz: 'foo'}, result: true},
            {expected: {}, actual: 'foo', result: false},
            {expected: null, actual: null, result: false},
            {expected: {foo: 'foo'}, actual: {bar: 'foo'}, result: false},
            {expected: {foo: {foo: 'foo'}}, actual: {foo: {bar: 'bar'}}, result: false},
            {expected: {foo: 'foo', bar: 'bar'}, actual: {bar: 'foo'}, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(havingProps(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('HavingValue', () => {
        let testData = [
            {actual: 'false', result: true},
            {actual: 0, result: true},
            {actual: false, result: true},
            {actual: null, result: false},
            {actual: undefined, result: false}
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(havingValue().setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('GreaterThan', () => {
        let testData = [
            {expected: 0, actual: 100, result: true},
            {expected: 0, actual: 1, result: true},
            {expected: 0, actual: 0, result: false},
            {expected: 0, actual: -1, result: false},
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(greaterThan(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('LessThan', () => {
        let testData = [
            {expected: 100, actual: 0, result: true},
            {expected: 1, actual: 0, result: true},
            {expected: 0, actual: 0, result: false},
            {expected: -1, actual: 0, result: false},
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(lessThan(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });

    describe('Negate', () => {
        let testData = [
            {expected: equaling('foo'), actual: 'foo', result: false},
            {expected: equaling('foo'), actual: 'bar', result: true},
            {expected: exactly(1), actual: 1, result: false},
            {expected: exactly(1), actual: true, result: true},
            {expected: between(0, 10), actual: 5, result: false},
            {expected: between(0, 10), actual: 15, result: true},
            {expected: containing('foo'), actual: ['foo', 'bar'], result: false},
            {expected: containing('baz'), actual: ['foo', 'bar'], result: true},
            {expected: havingValue(), actual: 'foo', result: false},
            {expected: havingValue(), actual: undefined, result: true},
            {expected: greaterThan(0), actual: 1, result: false},
            {expected: greaterThan(100), actual: 0, result: true},
        ];
        testData.forEach((data) => {
            it(`can get expected result from comparison: ${JSON.stringify(data)}`, () => {
                expect(not(data.expected).setActual(data.actual).compare()).toBe(data.result);
            });
        });
    });
});