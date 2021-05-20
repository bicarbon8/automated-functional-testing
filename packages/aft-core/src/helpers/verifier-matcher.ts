export interface VerifierMatcher {
    readonly expected: any;
    setActual(actual: any): VerifierMatcher;
    compare(): boolean;
    failureString(): string;
}

export class Equaling implements VerifierMatcher {
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
export const equaling = (expected: any): Equaling => {
    return new Equaling(expected);
};

export class Exactly implements VerifierMatcher {
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
export const exactly = (expected: any): Exactly => {
    return new Exactly(expected);
};

export class NumberBetween implements VerifierMatcher {
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
export const between = (minimum: number, maximum: number): NumberBetween => {
    return new NumberBetween(minimum, maximum);
};

export class ValueContaining implements VerifierMatcher {
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
export const containing = (expected: any): ValueContaining => {
    return new ValueContaining(expected);
};

export class HavingValue implements VerifierMatcher {
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
export const havingValue = (): HavingValue => {
    return new HavingValue();
}

export class GreaterThan implements VerifierMatcher {
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
export const greaterThan = (expected: number): GreaterThan => {
    return new GreaterThan(expected);
}

export class LessThan implements VerifierMatcher {
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
export const lessThan = (expected: number): LessThan => {
    return new LessThan(expected);
}

export class Negate implements VerifierMatcher {
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
export const not = (expected: VerifierMatcher): Negate => {
    return new Negate(expected);
}