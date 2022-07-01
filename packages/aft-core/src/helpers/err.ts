import { LogManager } from '../plugins/logging/log-manager';
import { convert } from './convert';
import { Func } from './custom-types';
import { ellide } from './ellide';

/**
 * provides a standardised way of generating log-friendly exception details
 * in either short or full formatting. Usage would look like:
 * ```typescript
 * const logMgr = new LogManager({logName: 'foo'});
 * Err.handle(() => functionThatThrowsTypeError(), logMgr);
 * ```
 * which would output:
 * ```text
 * YYYYMMDD - [foo] - WARN - TypeError: [100 characters of description] --- [300 characters of the stack trace]
 * ```
 * and:
 * ```typescript
 * const logMgr = new LogManager({logName: 'AFT'});
 * try {
 *     functionThatThrowsTypeError();
 * } catch (e) {
 *     await logMgr.warn(Err.short(e));
 *     await logMgr.warn(Err.full(e));
 * }
 * ```
 * which outputs:
 * ```text
 * YYYYMMDD - [AFT] - WARN - TypeError: [100 characters of description] --- [300 characters of the stack trace]
 * YYYYMMDD - [AFT] - WARN - TypeError: [full type error description message] --- [full stack trace of as much as the Error contained]
 * ```
 */
export class Err {
    readonly err: Error;

    private readonly _type: string;
    private readonly _message: string;
    private readonly _stack: string;

    constructor(err: any) {
        if (err) {
            if (!this._isError(err)) {
                this.err = new Error(String(err));
            } else {
                this.err = err;
            }
            if (this.err) {
                this._type = this.err.name || 'Error';
                this._message = this._removeBadCharacters(this.err.message);
                this._stack = this._removeBadCharacters(this._removeInternalStackLines(this.err.stack));
            }
        }
    }

    short(): string {
        return this._formatOutput(false);
    }

    full(): string {
        return this._formatOutput(true);
    }

    private _isError(obj: any): boolean {
        return obj?.name && obj?.message && obj?.stack;
    }

    private _removeInternalStackLines(stack: string): string {
        const resultStackLines = new Array<string>();
        const stackLines: Array<string> = stack.split('\n');
        for (var i=0; i<stackLines.length; i++) {
            let line = stackLines[i];
            if (line.match(/.*(err).(ts|js)/gi) == null) {
                resultStackLines.push(line);
            }
        }
        return resultStackLines.join('\n').replace(`${this._type}: ${this._message}`, '');
    }

    private _removeBadCharacters(input: string): string {
        return (input) ? convert.toSafeString(input, [
            {exclude: /\`/g, replaceWith: ''},
            {exclude: /[\n\t]/g, replaceWith: ''},
            {exclude: /[ ]{2,}/g, replaceWith: ' '}
        ]) : '';
    }

    private _formatOutput(full: boolean): string {
        let msg = (full) ? this._message : ellide(this._message, 100);
        let stk = (full) ? this._stack : ellide(this._stack, 300);
        return `${this._type}: ${msg} --- ${stk}`;
    }
}

export module Err {
    /**
     * @param err the `Error` to parse
     * @returns a shortened string formatted as `Error.name: Error.message (max 100 chars) --- Error.stack (max 300 chars)`
     * where any single quotes, newlines and extra spaces are removed
     */
    export function short(err: any): string {
        return new Err(err).short();
    }

    /**
     * @param err the `Error` to parse
     * @returns a full length string formatted as `Error.name: Error.message --- Error.stack`
     * where any single quotes, newlines and extra spaces are removed
     */
    export function full(err: any): string {
        return new Err(err).full();
    }

    /**
     * calls the passed in `Func<void, T | PromiseLike<T>>` and handles any errors
     * @param func a function to be run inside a try-catch
     * @param logMgr an optional `LogManager` that will log any error
     * @returns the result of the passed in `func` or `null` if an error is thrown
     */
    export async function handle<T extends any>(func: Func<void, T | PromiseLike<T>>, logMgr?: LogManager): Promise<T> {
        return await Promise.resolve()
        .then(func)
        .catch(async (err) => {
            await logMgr?.warn(Err.short(err));
            return null;
        });
    }
}