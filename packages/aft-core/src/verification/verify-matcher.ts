export interface VerifyMatcher {
    readonly expected: any;
    setActual(actual: any): VerifyMatcher; // eslint-disable-line no-unused-vars
    compare(): boolean;
    failureString(): string;
}

class Equaling implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(() => 5, equaling(5)); // succeeds
 * await t.verify(() => undefined, equaling(null)); // succeeds
 * await t.verify(() => true, equaling(false)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `Equaling` instance
 */
export const equaling = (expected: any): Equaling => {
    return new Equaling(expected);
};

class Exactly implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(() => 5, exactly(5)); // succeeds
 * await t.verify(() => undefined, exactly(null)); // fails
 * await t.verify(() => true, exactly(false)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `Exactly` instance
 */
export const exactly = (expected: any): Exactly => {
    return new Exactly(expected);
};

class EquivalentTo implements VerifyMatcher {
    readonly expected: Record<string | number | symbol, any>;
    private readonly _maxDepth: number;
    private _actual: any;
    private _failure: string;
    constructor(expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) {
        this.expected = expected;
        this._maxDepth = maxDepth ?? Infinity;
    }
    setActual(actual: any): VerifyMatcher {
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
    private _compareObjects(actual: Record<string | number | symbol, any>, expected: Record<string | number | symbol, any>, depth = 1): boolean {
        let equiv = true;
        const expectedKeys = Object.keys(expected);
        for (const prop of expectedKeys) {
            if (actual[prop] == null && expected[prop] != null) {
                equiv = false;
                this._failure = `'actual.${prop}' unset while 'expected.${prop}' had a value`;
                break;
            }
            if (typeof actual[prop] !== typeof expected[prop]) {
                equiv = false;
                this._failure = `typeof actual.${prop}: '${typeof actual[prop]}' not equal to '${typeof expected[prop]}'`;
                break;
            }
            if (typeof actual[prop] === 'function') {
                /* ignore */
            } else if (typeof expected[prop] === 'object') {
                if (depth < this._maxDepth) {
                    equiv = this._compareObjects(actual[prop], expected[prop], depth + 1);
                    if (!equiv) {
                        break;
                    }
                }
            } else if (actual[prop] != expected[prop]) {
                equiv = false;
                this._failure = `actual.${prop}: '${actual[prop]}' != '${expected[prop]}'`;
                break;
            }
        }
        return equiv;
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
 * usage within a `AftTest.verify` function would look like:
 * ```typescript
 * const t = new AftTest('description', () => null);
 * await t.verify(() => actualObject, equivalent(expectedObj, 6)); // succeeds if `actualObject` has matching properties and values to `expectedObject`
 * ```
 * @param expected the expected value
 * @param maxDepth the maximum level to recurse into any object properties @default Infinity
 * @returns a new `EquivalentTo` instance
 */
export const equivalent = (expected: Record<string | number | symbol, any>, maxDepth: number = Infinity): EquivalentTo => {
    return new EquivalentTo(expected, maxDepth);
};

class NumberBetween implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(5, between(5, 6)); // succeeds
 * await t.verify(5, between(4, 5)); // succeeds
 * await t.verify(5, between(-5, 10)); // succeeds
 * await t.verify(5, between(0, 4)); // fails
 * await t.verify(5, between(6, 10)); // fails
 * await t.verify(null, between(6, 10)); // fails
 * ```
 * @param minimum the minimum value the `actual` result can be
 * @param maximum the maximum value the `actual` result can be
 * @returns a new `NumberBetween` instance
 */
export const between = (minimum: number, maximum: number): NumberBetween => {
    return new NumberBetween(minimum, maximum);
};

class ValueContaining implements VerifyMatcher {
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
                return this._actual.some((item) => {
                    if (typeof item === 'string') {
                        return item.includes(String(this.expected));
                    } else {
                        return item === this.expected;
                    }
                });
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
        if (typeof this._actual === "string") {
            _actualStr = this._actual;
        } else {
            if (this._actual['has'] && this._actual['clear'] && this._actual['size'] !== undefined) {
                _actualStr = Array.from(this._actual).join(', ');
            }
            if (Array.isArray(this._actual)) {
                _actualStr = this._actual.join(', ');
            }
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
 * const t = new AftTest('description', () => null);
 * await t.verify(() => 'foobarbaz', containing('bar')); // succeeds
 * await t.verify(() => [1, 2, 3, 4, 5, 6], containing(5)); // succeeds
 * await t.verify(() => new Set([1, 2, 3, 4, 5, 6], containing(5)); // succeeds
 * await t.verify(() => new Map([[5, 'five'], [6, 'six']]), containing(5)); // succeeds
 * await t.verify(() => 'foo', containing('oof')); // fails
 * await t.verify(() => new Map([[5, 'five'], [6, 'six']]), containing('five')); // fails
 * await t.verify(() => ['foobarbaz','wolfhound','racecar'], containing('bar')); // succeeds
 * ```
 * @param expected the expected value
 * @returns a new `ValueContaining` instance
 */
export const containing = (expected: any): ValueContaining => {
    return new ValueContaining(expected);
};

class HavingProperties implements VerifyMatcher {
    readonly expected: any;
    private readonly _maxDepth: number;
    private _actual: unknown;
    private _failure: string;
    constructor(expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) {
        this.expected = expected;
        this._maxDepth = maxDepth ?? 1;
    }
    setActual(actual: unknown): VerifyMatcher {
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
        let equiv = true;
        const expectedKeys = Object.keys(expected);
        for (const prop of expectedKeys) {
            if (actual[prop] == null && expected[prop] != null) {
                equiv = false;
                this._failure = `'actual.${prop}' unset or non-existing while 'expected.${prop}' exists`;
                break;
            }
            if (typeof actual[prop] !== typeof expected[prop]) {
                equiv = false;
                this._failure = `typeof actual.${prop}: '${typeof actual[prop]}' not equal to '${typeof expected[prop]}'`;
                break;
            }
            if (typeof expected[prop] === 'object'
                && depth < this._maxDepth) {
                    equiv = this._compareObjects(actual[prop], expected[prop], depth + 1);
                    if (!equiv) {
                        break;
                    }
            }
        }
        return equiv;
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
 * and a `baz` property of type `boolean`. usage in an `AftTest.verify` function would look like:
 * ```typescript
 * const t = new AftTest('description', () => null);
 * await t.verify(() => {foo: 'bar', baz: true}, havingProps({foo: 'any', baz: false})); // succeeds
 * ```
 * @param expected an object or array containing properties
 * @param maxDepth a number indicating how deeply comparison should recurse into the objects @default Infinity
 * @returns a new {HavingProperties} instance
 */
export const havingProps = (expected: Record<string | number | symbol, any>, maxDepth: number = Infinity) => new HavingProperties(expected, maxDepth);

class HavingValue implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(() => 'foobarbaz', havingValue()); // succeeds
 * await t.verify(() => false, havingValue()); // succeeds
 * await t.verify(() => 0, havingValue()); // succeeds
 * await t.verify(() => null, havingValue()); // fails
 * await t.verify(() => undefined, havingValue()); // fails
 * ```
 * @returns a new `HavingValue` instance
 */
export const havingValue = (): HavingValue => {
    return new HavingValue();
}

class GreaterThan implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(5, greaterThan(0)); // succeeds
 * await t.verify(5, greaterThan(4.999)); // succeeds
 * await t.verify(5, greaterThan(5)); // fails
 * await t.verify(null, greaterThan(0)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `GreaterThan` instance
 */
export const greaterThan = (expected: number): GreaterThan => {
    return new GreaterThan(expected);
}

class LessThan implements VerifyMatcher {
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
 * const t = new AftTest('description', () => null);
 * await t.verify(() => 5, lessThan(10)); // succeeds
 * await t.verify(() => 5, lessThan(5.0001)); // succeeds
 * await t.verify(() => 5, lessThan(5)); // fails
 * await t.verify(() => null, lessThan(10)); // fails
 * ```
 * @param expected the expected value
 * @returns a new `LessThan` instance
 */
export const lessThan = (expected: number): LessThan => {
    return new LessThan(expected);
}

class Negate implements VerifyMatcher {
    readonly expected: VerifyMatcher;
    constructor(expected: VerifyMatcher) {
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
 * used to perform a `not(VerifyMatcher.compare())` comparison
 * between the `expected` and `actual` result
 * like: 
 * ```
 * const t = new AftTest('description', () => null);
 * await t.verify(5, not(equaling(10))); // succeeds
 * await t.verify(null, not(exactly(undefined))); // succeeds
 * await t.verify([1, 2, 3], not(containing(5))); // succeeds
 * await t.verify(null, not(havingValue())); // succeeds
 * ```
 * @param expected a {VerifyMatcher} to negate
 * @returns a new `Negate` instance
 */
export const not = (expected: VerifyMatcher): Negate => {
    return new Negate(expected);
}
