export interface VerifierMatcher {
    expected: any;
    actual: any;
    compare(): boolean;
    onFailureString(): string;
}

export class Equaling implements VerifierMatcher {
    expected: any;
    actual: any;
    constructor(expected: any) {
        this.expected = expected;
    }
    compare(): boolean {
        return this.expected == this.actual;
    }
    onFailureString(): string {
        return `expected '${this.expected}' to equal '${this.actual}'`;
    }
}

export class Exactly implements VerifierMatcher {
    expected: any;
    actual: any;
    constructor(expected: any) {
        this.expected = expected;
    }
    compare(): boolean {
        return this.expected === this.actual;
    }
    onFailureString(): string {
        return `expected '${this.expected}' to be the same instance as '${this.actual}'`;
    }
}
export const exactly = (expected: any): Exactly => {
    return new Exactly(expected);
};

export class NumberBetween implements VerifierMatcher {
    private readonly _min: number;
    private readonly _max: number;
    expected: string;
    actual: number;
    constructor(minimum: number, maximum: number) {
        this._min = minimum;
        this._max = maximum;
        this.expected = `${this._min}-${this._max}`;
    }
    compare(): boolean {
        if (this._min <= this.actual && this.actual <= this._max) {
            return true;
        }
        return false;
    }
    
    onFailureString(): string {
        return `expected '${this.actual}' to be between '${this.expected}'`;
    }
}
export const between = (minimum: number, maximum: number): NumberBetween => {
    return new NumberBetween(minimum, maximum);
};

export class ValueContaining implements VerifierMatcher {
    expected: any;
    actual: string | Array<any> | Set<any> | Map<any, any>;
    constructor(expected: any) {
        this.expected = expected;
    }
    compare(): boolean {
        if (this.actual) {
            if (Array.isArray(this.actual)) {
                return this.actual.includes(this.expected);
            }
            if (this.actual['has'] && this.actual['clear'] && this.actual['size'] !== undefined) {
                return (this.actual as Set<any>).has(this.expected);
            }
            if (this.expected) {
                return (this.actual as string).includes(this.expected);
            }
        }
        return false;
    }
    onFailureString(): string {
        let actualStr: string;
        if (this.actual['has'] && this.actual['clear'] && this.actual['size'] !== undefined) {
            actualStr = Array.from(this.actual).join(', ');
        }
        if (Array.isArray(this.actual)) {
            actualStr = this.actual.join(', ');
        }
        return `expected '${this.expected}' to be contained in [${actualStr}]`;
    }
}
export const containing = (expected: any): ValueContaining => {
    return new ValueContaining(expected);
};

export class HavingValue implements VerifierMatcher {
    expected: string = 'value other than null or undefined';
    actual: any;
    compare(): boolean {
        return (this.actual !== null && this.actual !== undefined);
    }
    onFailureString(): string {
        return `expected '${this.actual}' to be a ${this.expected}`;
    }
}
export const havingValue = (): HavingValue => {
    return new HavingValue();
}

export class GreaterThan implements VerifierMatcher {
    expected: number;
    actual: number;
    constructor(expected: number) {
        this.expected = expected;
    }
    compare(): boolean {
        return this.actual > this.expected;
    }
    onFailureString(): string {
        return `expected '${this.actual}' to be greater than '${this.expected}'`;
    }
}
export const greaterThan = (expected: number): GreaterThan => {
    return new GreaterThan(expected);
}

export class LessThan implements VerifierMatcher {
    expected: number;
    actual: number;
    constructor(expected: number) {
        this.expected = expected;
    }
    compare(): boolean {
        return this.actual < this.expected;
    }
    onFailureString(): string {
        return `expected '${this.actual}' to be less than '${this.expected}'`;
    }
}
export const lessThan = (expected: number): LessThan => {
    return new LessThan(expected);
}

export class Negate implements VerifierMatcher {
    expected: VerifierMatcher;
    set actual(a: any) {
        this.expected.actual = a;
    }
    get actual(): any {
        return this.expected.actual;
    }
    constructor(expected: VerifierMatcher) {
        this.expected = expected;
    }
    compare(): boolean {
        return !this.expected.compare();
    }
    onFailureString(): string {
        return `not ${this.expected.onFailureString()}`;
    }
}
export const not = (expected: VerifierMatcher): Negate => {
    return new Negate(expected);
}