import { LogLevel } from '../logging/log-level';
import { Reporter } from '../plugins/reporting/reporter';
import { aftLogger } from '../logging/aft-logger';
import { convert } from './convert';
import { Func } from './custom-types';
import { ellide } from './ellide';

export type ErrVerbosity = 'full' | 'short';

export type ErrOptions = {
    /**
     * an optional `Reporter` instance to use in logging the error message
     * and stack
     */
    logger: Reporter;
    /**
     * the `LogLevel` to use when logging any caught `Error`. defaults to
     * `warn`
     */
    errLevel: LogLevel;
    /**
     * the amount of detail to include in the output message. defaults to
     * `full`
     */
    verbosity: ErrVerbosity;
}

/**
 * provides a standardised way of generating log-friendly exception details
 * in either short or full formatting. Usage would look like:
 * ```typescript
 * const result1 = Err.handle(() => functionThatThrowsTypeError());
 * const result2 = await Err.handleAsync(async () => asyncFunctionThatThrowsArgumentError());
 * ```
 * which would output:
 * ```text
 * YYYYMMDD - [AFT] - WARN  - TypeError: [max 100 characters of message...] --- [max 300 characters...of the stack trace]
 * YYYYMMDD - [AFT] - WARN  - ArgumentError: [max 100 characters of message...] --- [max 300 characters...of the stack trace]
 * ```
 * 
 * > NOTE: an optional `Partial<ErrorOptions>` object can be passed to the `handle` and `handleAsync` functions allowing
 * you to control the `LogLevel` used _(defaults to `'warn'`)_, the verbosity _(defaults to `'short'`)_, and the 
 * `Reporter` instance used _(defaults to `aftLog` global instance)_
 * 
 * and:
 * ```typescript
 * const logger = new Reporter('AFT');
 * try {
 *     functionThatThrowsTypeError();
 * } catch (e) {
 *     await logger.warn(Err.short(e));
 *     await logger.debug(Err.full(e));
 * }
 * ```
 * which outputs:
 * ```text
 * YYYYMMDD - [AFT] - WARN - TypeError: [max 100 characters of message...] --- [max 300 characters...of the stack trace]
 * YYYYMMDD - [AFT] - DEBUG - TypeError: [full type error message and stack trace]
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
            this._verbosity = 'short';
        }
        return this._verbosity;
    }

    setVerbosity(v: ErrVerbosity): this {
        this._verbosity = (['full', 'short'].includes(v)) ? v : 'short';
        return this;
    }

    get type(): string {
        return this.err?.name ?? 'Error';
    }

    get message(): string {
        return this.err?.message ?? 'unknown';
    }

    get stack(): string {
        return this.err?.stack ?? 'unknown';
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
        for (let i=1; i<stackLines.length; i++) {
            const line = stackLines[i];
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
     * calls the passed in `Func<void, T>` and handles any errors
     * @param func a function to be run inside a try-catch
     * @param opts an `ErrOptions` object containing options for this call to `handle`
     * @returns the result of the passed in `func` or `null` if an error is thrown
     */
    export function handle<T>(func: Func<void, T>, opts?: Partial<ErrOptions>): T {
        try {
            return func();
        } catch (e) {
            opts ??= {};
            opts.verbosity ??= 'short';
            opts.errLevel ??= 'warn';
            const err = new Err(e).setVerbosity(opts.verbosity);
            if (opts.logger) {
                opts.logger[opts?.errLevel](err.toString());
            } else {
                aftLogger.log({
                    name: this.constructor.name,
                    level: opts.errLevel,
                    message: err.toString()
                });
            }
            return null as T;
        }
    }

    /**
     * calls the passed in `Func<void, PromiseLike<T>>` and handles any errors
     * @param func a function to be run inside a try-catch
     * @param opts an `ErrOptions` object containing options for this call to `handle`
     * @returns the result of the passed in `func` or `null` if an error is thrown
     */
    export async function handleAsync<T>(func: Func<void, PromiseLike<T>>, opts?: Partial<ErrOptions>): Promise<T> {
        return await Promise.resolve()
            .then(func)
            .catch(async (err) => {
                opts ??= {};
                opts.verbosity ??= 'short';
                opts.errLevel ??= 'warn';
                const e = new Err(err).setVerbosity(opts?.verbosity);
                if (opts.logger) {
                    await opts.logger[opts?.errLevel ?? 'warn'](e.toString());
                } else {
                    aftLogger.log({
                        name: this.constructor.name,
                        level: opts.errLevel,
                        message: e.toString()
                    });
                }
                return null as T;
            });
    }
}