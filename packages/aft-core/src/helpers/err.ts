import { LogLevel } from '../plugins/logging/log-level';
import { LogManager } from '../plugins/logging/log-manager';
import { convert } from './convert';
import { Func } from './custom-types';
import { ellide } from './ellide';

export type ErrVerbosity = 'full' | 'short';

export type ErrOptions = {
    /**
     * an optional `LogManager` instance to use in logging the error message
     * and stack
     */
    logMgr?: LogManager;
    /**
     * the `LogLevel` to use when logging any caught `Error`. defaults to
     * `warn`
     */
    errLevel?: LogLevel;
    /**
     * the amount of detail to include in the output message. defaults to
     * `full`
     */
    verbosity?: ErrVerbosity;
}

/**
 * provides a standardised way of generating log-friendly exception details
 * in either short or full formatting. Usage would look like:
 * ```typescript
 * const logMgr = new LogManager({logName: 'foo'});
 * const result = await Err.handle(functionThatThrowsTypeError, {
 *     logMgr: logMgr,
 *     errLevel: 'debug',
 *     verbosity: 'short'
 * });
 * ```
 * which would output:
 * ```text
 * YYYYMMDD - [foo] - DEBUG - TypeError: [max 100 characters of message...] --- [max 300 characters of the ... first line of stack trace]
 * ```
 * and:
 * ```typescript
 * const logMgr = new LogManager({logName: 'AFT'});
 * try {
 *     functionThatThrowsTypeError();
 * } catch (e) {
 *     await logMgr.warn(Err.short(e));
 *     await logMgr.debug(Err.full(e));
 * }
 * ```
 * which outputs:
 * ```text
 * YYYYMMDD - [AFT] - WARN - TypeError: [max 100 characters of message...] --- [max 300 characters of the ... first line of stack trace]
 * YYYYMMDD - [AFT] - DEBUG - TypeError: [full type error description message]
 * [full stack trace of as much as the Error contained]
 * ```
 */
export class Err {
    readonly err: Error;
    private _verbosity: ErrVerbosity;

    constructor(error: any) {
        if (this._isError(error)) {
            this.err = error;
        } else {
            this.err = new Error(String(error || 'unknown'));
        }
    }

    get verbosity(): ErrVerbosity {
        if (!this._verbosity) {
            this._verbosity = 'full';
        }
        return this._verbosity;
    }

    setVerbosity(v: ErrVerbosity): this {
        this._verbosity = (['full', 'short'].includes(v)) ? v : 'full';
        return this;
    }

    get type(): string {
        return this.err?.name || 'Error';
    }

    get message(): string {
        return this.err?.message || 'unknown';
    }

    get stack(): string {
        return this.err?.stack || 'unknown';
    }

    toString(): string {
        const message = this._processMessage(this.message);
        const stack = this._processStack(this.stack);
        let output: string;
        if (this.verbosity === 'short') {
            output = `${this.type}: ${message} --- ${stack}`;
        } else {
            output = `${this.type}: ${message}\n${stack}`;
        }
        return output;
    }

    private _isError(obj: any): boolean {
        return obj?.name && obj?.message && obj?.stack;
    }

    private _processMessage(message: string): string {
        let msg = message;
        if (this.verbosity === 'short') {
            msg = ellide(msg, 100);
            msg = this._removeNewlinesAndExtraWhitespace(msg);
        }
        return msg;
    }

    private _processStack(stack: string): string {
        let stk = this._removeInternalStackLines(stack);
        if (this.verbosity === 'short') {
            const stackLines = stk.split('\n');
            if (stackLines.length > 0) {
                stk = ellide(stackLines[0], 300, 'middle');
            }
            stk = this._removeNewlinesAndExtraWhitespace(stk);
        }
        return stk;
    }

    private _removeInternalStackLines(stack: string): string {
        const resultStackLines = new Array<string>();
        const stackLines: Array<string> = stack?.split('\n') || [];
        for (var i=1; i<stackLines.length; i++) {
            let line = stackLines[i];
            if (line.match(/.*(err).(ts|js)/gi) == null) {
                resultStackLines.push(line);
            }
        }
        return resultStackLines.join('\n').replace(`${this.type}: ${this.message}`, '');
    }

    private _removeNewlinesAndExtraWhitespace(input: string): string {
        return (input) ? convert.toSafeString(input, [
            {exclude: /[\n\r]/g, replaceWith: ''},
            {exclude: /[\t]/g, replaceWith: ' '},
            {exclude: /[ ]{2,}/g, replaceWith: ' '}
        ]) : '';
    }
}

export module Err {
    /**
     * @param err the `Error` to parse
     * @returns a shortened string formatted as `Error.name: Error.message (max 100 chars) --- Error.stack (max 300 chars)`
     * where any newlines, tabs and extra spaces are removed
     */
    export function short(err: any): string {
        return new Err(err)
            .setVerbosity('short')
            .toString();
    }

    /**
     * @param err the `Error` to parse
     * @returns a full length string formatted as 
     * ```
     * Error.name: Error.message
     * Error.stack
     * ```
     * where the full Error details are preserved
     */
    export function full(err: any): string {
        return new Err(err)
            .setVerbosity('full')
            .toString();
    }

    /**
     * calls the passed in `Func<void, T | PromiseLike<T>>` and handles any errors
     * @param func a function to be run inside a try-catch
     * @param optsOrLogMgr an `ErrOptions` object containing options for this handler or a
     * `LogManager` used to log any captured `Error` _(defaults to `undefined`)_
     * > **WARNING** passing a `LogManager` is deprecated and you should instead add the
     * `LogManager` using the `logMgr` field in the `ErrOptions` instance)
     * @returns the result of the passed in `func` or `null` if an error is thrown
     */
    export async function handle<T extends any>(func: Func<void, T | PromiseLike<T>>, optsOrLogMgr?: LogManager | ErrOptions): Promise<T> {
        let opts: ErrOptions;
        if (_isLogManager(optsOrLogMgr)) { // TODO: remove this in next major release
            opts = {logMgr: optsOrLogMgr} as ErrOptions;
            await opts.logMgr?.warn(`passing a 'LogManager' is DEPRECATED! pass a 'ErrOptions' object containing your 'LogManager' instead`);
        } else {
            opts = optsOrLogMgr as ErrOptions || {};
        }
        return await Promise.resolve()
            .then(func)
            .catch(async (err) => {
                const e = new Err(err).setVerbosity(opts?.verbosity);
                await opts?.logMgr?.[opts?.errLevel || 'warn'](e.toString());
                return null;
            });
    }

    function _isLogManager(obj: any): boolean {
        if (obj?.logName && obj?.trace && obj?.debug && obj?.info) {
            return true;
        }
        return false;
    }
}