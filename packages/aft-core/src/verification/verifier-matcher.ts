import { Class } from "../helpers/custom-types";

export interface VerifierMatcher {
    readonly expected: any;
    setActual(actual: any): VerifierMatcher;
    compare(): boolean;
    failureString(): string;
}

class Equaling implements VerifierMatcher {
    readonly expected: any;
    private _actual: any;
    constructor(expected: any) {
        this.expected = expected;
    }
    setActual(actual: any): Equaling {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        return this.expected == this._actual;
    }
    failureString(): string {
        return `expected '${this.expected}' to equal '${this._actual}'`;
    }
}
/**
 * used to perform a `a == b` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 5).returns(equaling(5)); // succeeds
 * await verifier(() => undefined).returns(equaling(null)); // succeeds
 * await verifier(() => true).returns(equaling(false)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `Equaling` instance
 */
export const equaling = (expected: any): Equaling => {
    return new Equaling(expected);
};

class Exactly implements VerifierMatcher {
    readonly expected: any;
    private _actual: any;
    constructor(expected: any) {
        this.expected = expected;
    }
    setActual(actual: any): Exactly {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        return this.expected === this._actual;
    }
    failureString(): string {
        return `expected '${this.expected}' to be the same instance as '${this._actual}'`;
    }
}
/**
 * used to perform a `a === b` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 5).returns(exactly(5)); // succeeds
 * await verifier(() => undefined).returns(exactly(null)); // fails
 * await verifier(() => true).returns(exactly(false)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `Exactly` instance
 */
export const exactly = (expected: any): Exactly => {
    return new Exactly(expected);
};

class EquivalentTo implements VerifierMatcher {
    readonly expected: Record<string | number | symbol, any>;
    private readonly _maxDepth: number;
    private _actual: any;
    private _failure: string;
    constructor(expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) {
        this.expected = expected;
        this._maxDepth = maxDepth ?? Infinity;
    }
    setActual(actual: any): VerifierMatcher {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        if (this.expected == null || this._actual == null) {
            this._failure = `expected and actual must both be non-null objects; expected: '${this.expected}', actual: '${this._actual}'`;
            return false;
        }
        if (typeof this.expected !== 'object') {
            this._failure = `expected must be an object, but was '${typeof this.expected}'`;
            return false;
        }
        if (typeof this._actual !== 'object') {
            this._failure = `actual must be an object, but was '${typeof this._actual}'`;
            return false;
        }
        return this._compareObjects(this._actual, this.expected);
    }
    failureString(): string {
        return this._failure;
    }
    private _compareObjects(actual: Record<string | number | symbol, any>, expected: Record<string | number | symbol, any>, depth: number = 1): boolean {
        let equivalent: boolean = true;
        const expectedKeys = Object.keys(expected);
        for (let prop of expectedKeys) {
            if (actual[prop] == null && expected[prop] != null) {
                equivalent = false;
                this._failure = `'actual.${prop}' unset while 'expected.${prop}' had a value`;
                break;
            }
            if (typeof actual[prop] !== typeof expected[prop]) {
                equivalent = false;
                this._failure = `typeof actual.${prop}: '${typeof actual[prop]}' not equal to '${typeof expected[prop]}'`;
                break;
            }
            if (typeof actual[prop] === 'function') {
                /* ignore */
            } else if (typeof expected[prop] === 'object') {
                if (depth < this._maxDepth) {
                    equivalent = this._compareObjects(actual[prop], expected[prop], depth + 1);
                    if (!equivalent) {
                        break;
                    }
                }
            } else if (actual[prop] != expected[prop]) {
                equivalent = false;
                this._failure = `actual.${prop}: '${actual[prop]}' != '${expected[prop]}'`;
                break;
            }
        }
        return equivalent;
    }
}
/**
 * used to perform a comparisons between two objects or arrays
 * where the `actual` is a super-set of the `expected`. for example:
 * ```typescript
 * const expected = {
 *     foo: 'bar',
 *     baz: true
 * }
 * const actual = {
 *     foo: 'bar',
 *     baz: true,
 *     meaning: 42
 * }
 * const res1 = equivalent(expected)
 *     .setActual(actual)
 *     .compare(); // returns `true`
 * const res2 = equivalent(actual)
 *     .setActual(expected)
 *     .compare(); // returns `false`
 * console.log(res2.failureString()); // 'actual.meaning' unset while 'expected.meaning' had a value
 * ```
 * usage within a {Verifier} would look like:
 * ```typescript
 * await verifier(() => actualObject).returns(equivalent(expectedObj, 6)); // succeeds if `actualObject` has matching properties to `expectedObject`
 * ```
 * @param expected the expected value
 * @param maxDepth the maximum level to recurse into any object properties @default Infinity
 * @returns a new `EquivalentTo` instance
 */
export const equivalent = (expected: Record<string | number | symbol, any>, maxDepth: number = Infinity): EquivalentTo => {
    return new EquivalentTo(expected, maxDepth);
};

class NumberBetween implements VerifierMatcher {
    private readonly _min: number;
    private readonly _max: number;
    readonly expected: string;
    private _actual: number;
    constructor(minimum: number, maximum: number) {
        this._min = minimum;
        this._max = maximum;
        this.expected = `${this._min}-${this._max}`;
    }
    setActual(actual: number): NumberBetween {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        if (this._min <= this._actual && this._actual <= this._max) {
            return true;
        }
        return false;
    }
    
    failureString(): string {
        return `expected '${this._actual}' to be between '${this.expected}'`;
    }
}
/**
 * used to perform a `min <= actual <= max` comparison
 * between the `minimum`, `maximum` and `actual` result
 * like: 
 * ```typescript
 * await verifier(() => 5).returns(between(5, 6)); // succeeds
 * await verifier(() => 5).returns(between(4, 5)); // succeeds
 * await verifier(() => 5).returns(between(-5, 10)); // succeeds
 * await verifier(() => 5).returns(between(0, 4)); // fails
 * await verifier(() => 5).returns(between(6, 10)); // fails
 * await verifier(() => null).returns(between(6, 10)); // fails
 * ```
 * @param minimum the minimum value the `actual` result can be
 * @param maximum the maximum value the `actual` result can be
 * @returns a new `NumberBetween` instance
 */
export const between = (minimum: number, maximum: number): NumberBetween => {
    return new NumberBetween(minimum, maximum);
};

class ValueContaining implements VerifierMatcher {
    readonly expected: any;
    private _actual: string | Array<any> | Set<any> | Map<any, any>;
    constructor(expected: any) {
        this.expected = expected;
    }
    setActual(actual: string | Array<any> | Set<any> | Map<any, any>): ValueContaining {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        if (this._actual) {
            if (Array.isArray(this._actual)) {
                return this._actual.includes(this.expected);
            }
            if (this._actual['has'] && this._actual['clear'] && this._actual['size'] !== undefined) {
                return (this._actual as Set<any>).has(this.expected);
            }
            if (this.expected) {
                return (this._actual as string).includes(this.expected);
            }
        }
        return false;
    }
    failureString(): string {
        let _actualStr: string;
        if (this._actual['has'] && this._actual['clear'] && this._actual['size'] !== undefined) {
            _actualStr = Array.from(this._actual).join(', ');
        }
        if (Array.isArray(this._actual)) {
            _actualStr = this._actual.join(', ');
        }
        return `expected '${this.expected}' to be contained in [${_actualStr}]`;
    }
}
/**
 * used to perform a `[a, b, c] includes b` or `Set([a, b, c]) has b`
 * or `Map([[a, aval], [b, bval]]) has b` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 'foobarbaz').returns(containing('bar')); // succeeds
 * await verifier(() => [1, 2, 3, 4, 5, 6]).returns(containing(5)); // succeeds
 * await verifier(() => new Set([1, 2, 3, 4, 5, 6]).returns(containing(5)); // succeeds
 * await verifier(() => new Map([[5, 'five'], [6, 'six']])).returns(containing(5)); // succeeds
 * await verifier(() => 'foo').returns(containing('oof')); // fails
 * await verifier(() => new Map([[5, 'five'], [6, 'six']])).returns(containing('five')); // fails
 * ```
 * @param expected the expected value
 * @returns a new `ValueContaining` instance
 */
export const containing = (expected: any): ValueContaining => {
    return new ValueContaining(expected);
};

class HavingProperties implements VerifierMatcher {
    readonly expected: any;
    private readonly _maxDepth: number;
    private _actual: unknown;
    private _failure: string;
    constructor(expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) {
        this.expected = expected;
        this._maxDepth = maxDepth ?? 1;
    }
    setActual(actual: unknown): VerifierMatcher {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        if (this.expected == null || this._actual == null) {
            this._failure = `expected and actual must both be non-null objects; expected: '${this.expected}', actual: '${this._actual}'`;
            return false;
        }
        if (typeof this.expected !== 'object') {
            this._failure = `expected must be an object, but was '${typeof this.expected}'`;
            return false;
        }
        if (typeof this._actual !== 'object') {
            this._failure = `actual must be an object, but was '${typeof this._actual}'`;
            return false;
        }
        return this._compareObjects(this._actual, this.expected);
    }
    failureString(): string {
        return this._failure;
    }
    private _compareObjects(actual: Record<string | number | symbol, any>, expected: Record<string | number | symbol, any>, depth: number = 1): boolean {
        let equivalent: boolean = true;
        const expectedKeys = Object.keys(expected);
        for (let prop of expectedKeys) {
            if (actual[prop] == null && expected[prop] != null) {
                equivalent = false;
                this._failure = `'actual.${prop}' unset or non-existing while 'expected.${prop}' exists`;
                break;
            }
            if (typeof actual[prop] !== typeof expected[prop]) {
                equivalent = false;
                this._failure = `typeof actual.${prop}: '${typeof actual[prop]}' not equal to '${typeof expected[prop]}'`;
                break;
            }
            if (typeof expected[prop] === 'object') {
                if (depth < this._maxDepth) {
                    equivalent = this._compareObjects(actual[prop], expected[prop], depth + 1);
                    if (!equivalent) {
                        break;
                    }
                }
            }
        }
        return equivalent;
    }
}
/**
 * compares the passed in `expected` object to an `actual` checking that they both contain all the same
 * properties and property types as are found in the `expected` object. for example, given an `expected`
 * of:
 * ```typescript
 * const expected = {
 *     foo: 'bar',
 *     baz: true
 * }
 * ```
 * and an `actual` of:
 * ```typescript
 * const actual = {
 *     foo: 'foo',
 *     bar: 42,
 *     baz: false
 * }
 * ```
 * calling the following:
 * ```typescript
 * havingProps(expected).setActual(actual).compare(); // true
 * ```
 * would return true because `actual` has both a `foo` property of type `string`
 * and a `baz` property of type `boolean`. usage in a {Verifier} would look like:
 * ```typescript
 * await verifier(() => {foo: 'bar', baz: true}).returns(havingProps({foo: 'any', baz: false})); // succeeds
 * ```
 * @param expected an object or array containing properties
 * @param maxDepth a number indicating how deeply comparison should recurse into the objects @default Infinity
 * @returns a new {HavingProperties} instance
 */
export const havingProps = (expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) => new HavingProperties(expected, maxDepth);

class HavingValue implements VerifierMatcher {
    readonly expected: string = 'value other than null or undefined';
    private _actual: any;
    setActual(actual: any): HavingValue {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        return (this._actual !== null && this._actual !== undefined);
    }
    failureString(): string {
        return `expected '${this._actual}' to be a ${this.expected}`;
    }
}
/**
 * used to perform a `a !== null && a !== undefined` comparison
 * between the where `a` is the `actual` result
 * like: 
 * ```
 * await verifier(() => 'foobarbaz').returns(havingValue()); // succeeds
 * await verifier(() => false).returns(havingValue()); // succeeds
 * await verifier(() => 0).returns(havingValue()); // succeeds
 * await verifier(() => null).returns(havingValue()); // fails
 * await verifier(() => undefined).returns(havingValue()); // fails
 * ```
 * @returns a new `HavingValue` instance
 */
export const havingValue = (): HavingValue => {
    return new HavingValue();
}

class GreaterThan implements VerifierMatcher {
    readonly expected: number;
    private _actual: number;
    constructor(expected: number) {
        this.expected = expected;
    }
    setActual(actual: number): GreaterThan {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        return this._actual > this.expected;
    }
    failureString(): string {
        return `expected '${this._actual}' to be greater than '${this.expected}'`;
    }
}
/**
 * used to perform a `actual > expected` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 5).returns(greaterThan(0)); // succeeds
 * await verifier(() => 5).returns(greaterThan(4.999)); // succeeds
 * await verifier(() => 5).returns(greaterThan(5)); // fails
 * await verifier(() => null).returns(greaterThan(0)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `GreaterThan` instance
 */
export const greaterThan = (expected: number): GreaterThan => {
    return new GreaterThan(expected);
}

class LessThan implements VerifierMatcher {
    readonly expected: number;
    private _actual: number;
    constructor(expected: number) {
        this.expected = expected;
    }
    setActual(actual: number): LessThan {
        this._actual = actual;
        return this;
    }
    compare(): boolean {
        return this._actual < this.expected;
    }
    failureString(): string {
        return `expected '${this._actual}' to be less than '${this.expected}'`;
    }
}
/**
 * used to perform a `actual < expected` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 5).returns(lessThan(10)); // succeeds
 * await verifier(() => 5).returns(lessThan(5.0001)); // succeeds
 * await verifier(() => 5).returns(lessThan(5)); // fails
 * await verifier(() => null).returns(lessThan(10)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `LessThan` instance
 */
export const lessThan = (expected: number): LessThan => {
    return new LessThan(expected);
}

class Negate implements VerifierMatcher {
    readonly expected: VerifierMatcher;
    constructor(expected: VerifierMatcher) {
        this.expected = expected;
    }
    setActual(actual: any): Negate {
        this.expected.setActual(actual);
        return this;
    }
    compare(): boolean {
        return !this.expected.compare();
    }
    failureString(): string {
        return `not ${this.expected.failureString()}`;
    }
}
/**
 * used to perform a `not(VerifierMatcher.compare())` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * await verifier(() => 5).returns(not(equaling(10))); // succeeds
 * await verifier(() => null).returns(not(exactly(undefined))); // succeeds
 * await verifier(() => [1, 2, 3]).returns(not(containing(5))); // succeeds
 * await verifier(() => null).returns(not(havingValue())); // succeeds
 * ```
 * @param expected a {VerifierMatcher} to negate
 * @returns a new `Negate` instance
 */
export const not = (expected: VerifierMatcher): Negate => {
    return new Negate(expected);
}