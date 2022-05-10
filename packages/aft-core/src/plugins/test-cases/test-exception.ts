import { convert } from '../../helpers/converter';
import { ellide } from '../../helpers/ellide';

/**
 * provides a standardised way of generating log-friendly exception details
 * in either short or full formatting. Usage would look like:
 * ```json
 * try {
 *   functionThatThrowsTypeError();
 * } catch (e: Error) {
 *   await logManager.warn(TestException.short(e));
 *   await logManager.warn(TestException.full(e));
 * }
 * ```
 * which would output:
 * ```
 * YYYYMMDD - [AFT] - WARN  - TypeError: [100 characters of description] --- [100 characters of the stack trace]
 * YYYYMMDD - [AFT] - WARN  - TypeError: [full type error description message] --- [full stack trace of as much as the Error contained]
 * ```
 */
export class TestException {
    readonly err: Error;

    private readonly _type: string;
    private readonly _message: string;
    private readonly _stack: string;

    constructor(err: Error) {
        this.err = err;
        if (this.err) {
            this._type = err.name;
            this._message = this._removeBadCharacters(err.message);
            this._stack = this._removeBadCharacters(err.stack);
        }
    }

    short(): string {
        return this._formatOutput(false);
    }

    full(): string {
        return this._formatOutput(true);
    }

    private _removeBadCharacters(input: string): string {
        return (input) ? convert.toSafeString(input, [
            {exclude: /\`/g, replaceWith: ''},
            {exclude: /\</g, replaceWith: '&lt;'},
            {exclude: /\>/g, replaceWith: '&gt;'},
            {exclude: /[\n\t]/g, replaceWith: ''}
        ]) : '';
    }

    private _formatOutput(full: boolean): string {
        let msg = (full) ? this._message : ellide(this._message, 100);
        let stk = (full) ? this._stack : ellide(this._stack, 100);
        return `${this._type}: ${msg} --- ${stk}`;
    }
}

export module TestException {
    /**
     * @param err the `Error` to parse
     * @returns a shortened string formatted as `Error.name: Error.message --- Error.stack`
     * where any single quotes are removed, and some elements are HTML encoded
     */
    export function short(err: Error): string {
        return new TestException(err).short();
    }

    /**
     * @param err the `Error` to parse
     * @returns a full length string formatted as `Error.name: Error.message --- Error.stack`
     * where any single quotes are removed and smoe elements are HTML encoded
     */
    export function full(err: Error): string {
        return new TestException(err).full();
    }
}