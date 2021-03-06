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
 * @param expected the expected value
 * @returns a new {Equaling} instance
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
 * @param expected the expected value
 * @returns a new {Exactly} instance
 */
export const exactly = (expected: any): Exactly => {
    return new Exactly(expected);
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
 * @param minimum the minimum value the `actual` result can be
 * @param maximum the maximum value the `actual` result can be
 * @returns a new {NumberBetween} instance
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
 * @param expected the expected value
 * @returns a new {ValueContaining} instance
 */
export const containing = (expected: any): ValueContaining => {
    return new ValueContaining(expected);
};

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
 * @returns a new {HavingValue} instance
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
 * @param expected the expected value
 * @returns a new {GreaterThan} instance
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
 * @param expected the expected value
 * @returns a new {LessThan} instance
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
 * @param expected a {VerifierMatcher} to negate
 * @returns a new {Negate} instance
 */
export const not = (expected: VerifierMatcher): Negate => {
    return new Negate(expected);
}