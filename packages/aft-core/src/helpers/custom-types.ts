/**
 * Type to represent any function accepting a single argument
 * of type `T` that returns void. an alternative to writing:
 * ```
 * (input: T): void
 * ```
 */
export type Action<T> = {
    (item: T): void; // eslint-disable-line no-unused-vars
};

/**
 * allows for creation of functions that can create new instances of
 * generic types. Ex:
 * ```
 * function get<T>(cType: Class<T>, ...args: any[]): T {
 *     return new cType(...args);
 * }
 * ```
 * which can then be used like:
 * ```
 * let obj: CustomObj = get(CustomObj, 'foo', 123);
 * ```
 * assuming that `CustomObj` looks like:
 * ```
 * class CustomObj {
 *     someStr: string;
 *     someNum: number;
 *     constructor(inputStr: string, inputNum: number) {
 *         this.someStr = inputStr;
 *         this.someNum = inputNum;
 *     }
 * }
 * ```
 */
export type Class<T> = {
    new (...args: any[]): T; // eslint-disable-line no-unused-vars
    readonly prototype: T;
};

/**
 * Type representing a function accepting a single input
 * of type `T` and returning a result of type `TResult`.
 * an alternative to writing:
 * ```
 * (input: T) => TResult
 * ```
 */
export type Func<T, TResult> = (x: T) => TResult; // eslint-disable-line no-unused-vars

/**
 * a valid key that can be used in any JSON object
 */
export type JsonKey = string | number;

/**
 * a valid value that can be assigned to a `JsonKey` in
 * any JSON object
 */
export type JsonValue = JsonKey | boolean | JsonObject | null | undefined;

/**
 * a valid JSON object
 */
export type JsonObject = { [key: JsonKey]: JsonValue; } | Array<JsonValue>;

/**
 * this type allows for a descriptive message to be
 * included in a result from functions that would normally
 * be limited to returning only a single value
 * 
 * ex:
 * ```typescript
 * function shouldDoWork(input: Worker): ProcessingResult<boolean> {
 *     try {
 *         const result = input.functionThatMightThrow();
 *         return { result: result };
 *     } catch (e) {
 *         return { result: false, message: Err.short(e) };
 *     }
 * }
 * ```
 */
export type ProcessingResult<T> = {
    /**
     * the result of processing if successful, otherwise
     * `undefined`
     */
    result?: T;
    /**
     * an optional message explaining why the result is what
     * it is. this is typically set only on error to provide
     * context around the error
     */
    message?: string;
};

/**
 * used to contain valid JSON data and indicate a validity date
 * after which the data is considered to be expired
 */
export type CacheObject = {
    validUntil?: number;
    data?: JsonValue;
};

/**
 * a type representing the merging of two or more specified types
 * 
 * #### NOTE:
 * > if you need to merge more than 6 types then create 
 * intermediate types and use the merging of those like:
 * > 
 * > ```typescript
 * > const type foo = Merge<t1, t2, t3, t4, t5, t6>;
 * > const type bar = Merge<t7, t8, t9, t10, t11, t12>;
 * > const type foobar = Merge<foo, bar>;
 * > ```
 */
export type Merge<T1, T2, T3 = {}, T4 = {}, T5 = {}, T6 = {}> = T1 & T2 & T3 & T4 & T5 & T6;
