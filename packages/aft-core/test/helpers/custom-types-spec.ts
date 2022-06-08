import { Action, Class, Func, JsonObject, Merge, rand } from "../../src";

describe('custom-types', () => {
    describe('Class<T>', () => {
        it('can create object from type', async () => {
            let sample: FooSampleClass = get(FooSampleClass);

            expect(sample).toBeDefined();
            expect(sample.foo).toBe('foo');
            expect(sample.bar(1)).toBe(1);
            expect(sample.constructor.name).toEqual('FooSampleClass');
        });

        it('can create object from type with arguments', async () => {
            let expected: number = rand.getInt(1, 99);
            let sample: BarSampleClass = get(BarSampleClass, expected);

            expect(sample).toBeDefined();
            expect(sample.foo('foo')).toBe('foo');
            expect(sample.bar).toBe(expected);
        });
    });

    describe('Func<T,TResult>', () => {
        it('can describe a function taking in and returning types', () => {
            let voidBoolean: Func<void, boolean> = () => {
                return true;
            };
            expect(voidBoolean()).toBeTruthy();

            let booleanVoid: Func<boolean, void> = (bool: boolean) => {
                /* no return */
            }
            expect(booleanVoid(true)).toBeUndefined();

            let voidVoid: Func<void, void> = () => {
                /* no ins and outs */
            }
            expect(voidVoid()).toBeUndefined();
        });
    });

    describe('Action<T>', () => {
        it('can describe a function taking in certain types', () => {
            let nada: Action<void> = () => {
                /* no return */
            };
            expect(nada()).toBeUndefined();

            let bool: Action<boolean> = (bool: boolean) => {
                /* no return */
            }
            expect(bool(true)).toBeUndefined();
        });
    });

    describe('JsonKey', () => {
        it('can use a number for a JSON object key', () => {
            const sym1 = 12;
            const sym2 = 15;
            const obj: JsonObject = {
                [sym1]: 'bar',
                [sym2]: 'baz'
            };

            expect<string>(obj[sym1] as string).toEqual('bar');
            expect<string>(obj[sym2] as string).toEqual('baz');
        });

        it('can use a string for a JSON object key', () => {
            const sym1 = 'foo';
            const sym2 = 'faz';
            const obj: JsonObject = {
                [sym1]: 'bar',
                [sym2]: 'baz'
            };

            expect<string>(obj[sym1] as string).toEqual('bar');
            expect<string>(obj[sym2] as string).toEqual('baz');
        });
    });

    describe('Merge<T1, T2, T3, T4, T5, T6>', () => {
        it('can create a merged type from two types', () => {
            type Foo = { foo: string; };
            type Bar = { bar: boolean; };

            type FooBar = Merge<Foo, Bar>;

            const foobar: FooBar = {} as FooBar;
            foobar.foo = 'foo';
            foobar.bar = true;
            expect(foobar.foo).toBeTruthy();
            expect(foobar.bar).toBeTruthy();
        });
    });
});

var get = function<T>(type: Class<T>, ...args: any[]): T {
    return new type(...args);
};

class FooSampleClass {
    foo: string = 'foo';
    bar(input: number): number {
        return input;
    }
}

class BarSampleClass {
    bar: number;
    constructor(bar: number) {
        this.bar = bar;
    }
    foo(input: string): string {
        return input;
    }
}