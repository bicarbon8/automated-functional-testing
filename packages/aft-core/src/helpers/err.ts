import { AftLogger, aftLogger } from '../logging/aft-logger';
import { LogLevel } from '../logging/log-level';
import { convert } from './convert';
import { Func, ProcessingResult } from './custom-types';
import { ellide } from './ellide';

export type ErrVerbosity = 'full' | 'short';

export type ErrOptions = {
    /**
     * an optional `AftLogger` instance to use for logging to console.
     * @default aftLogger
     */
    logger?: AftLogger;
    /**
     * the `LogLevel` to use when logging any caught `Error`.
     * @default none
     */
    errLevel: LogLevel;
    /**
     * the amount of detail to include in the output message.
     * @default full
     */
    verbosity: ErrVerbosity;
}

/**
 * provides a standardised way of generating log-friendly exception details
 * in either short or full formatting. Usage would look like:
 * ```typescript
 * const result1 = Err.handle(() => functionThatThrowsTypeError(arg1, arg2));
 * const result2 = await Err.handleAsync(() => asyncFunctionThatThrowsArgumentError(arg1, arg2));
 * ```
 * which would output:
 * ```text
 * YYYYMMDD - [AFT] - WARN  - TypeError: [max 100 characters of message...] --- [max 300 characters...of the stack trace]
 * YYYYMMDD - [AFT] - WARN  - ArgumentError: [max 100 characters of message...] --- [max 300 characters...of the stack trace]
 * ```
 * #### NOTE:
 * > an optional `Partial<ErrorOptions>` object can be passed to the `handle` and `handleAsync` functions allowing
 * you to control the `LogLevel` used _(defaults to `'warn'`)_, the verbosity _(defaults to `'short'`)_, and the 
 * `ReportingManager` instance used _(defaults to `aftLog` global instance)_
 * 
 * and:
 * ```typescript
 * const logger = new ReportingManager('AFT');
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
export class Err extends Object {
    readonly err: Error;
    private _verbosity: ErrVerbosity;

    constructor(error: any) {
        super();
        if (this._isError(error)) {
            this.err = error;
        } else if (typeof error === 'string') {
            this.err = new Error(String(error || 'unknown'));
        } else {
            try {
                this.err = new Error(JSON.stringify(error));
            } catch (e) {
                this.err = e;
            }
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

    /**
     * the type of `Error`
     */
    get type(): string {
        return this.err?.name ?? 'Error';
    }

    /**
     * the `message` portion of the `Error`
     */
    get message(): string {
        return this.err?.message ?? 'unknown';
    }

    /**
     * the stack trace of the `Error` object
     */
    get stack(): string {
        return this.err?.stack ?? 'unknown';
    }

    override toString(): string {
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

    /**
     * @param err the `Error` to parse
     * @returns a shortened string formatted as `Error.name: Error.message (max 100 chars) --- Error.stack (max 300 chars)`
     * where any newlines, tabs and extra spaces are removed
     */
    static short(err: any): string {
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
    static full(err: any): string {
        return new Err(err)
            .setVerbosity('full')
            .toString();
    }

    /**
     * calls the passed in `Func<void, T>` and handles any errors
     * @param func a function to be run inside a try-catch
     * @param opts an `ErrOptions` object containing options for this call
     * @returns a `ProcessingResult` where `result` is the output of the passed in `func`
     * and `message` will **ONLY** be set if an error was caught
     */
    static handle<T>(func: Func<void, T>, opts?: Partial<ErrOptions>): ProcessingResult<T> {
        try {
            const res = func();
            return { result: res };
        } catch (e) {
            return {result: null as T, message: Err._processException(e, opts)};
        }
    }

    /**
     * calls the passed in `Func<void, T | PromiseLike<T>>` and handles any errors
     * @param func an async function to be awaited inside a try-catch
     * @param opts an `ErrOptions` object containing options for this call
     * @returns a `ProcessingResult` where `result` is the output of the passed in `func`
     * and `message` will **ONLY** be set if an error was caught
     */
    static async handleAsync<T>(func: Func<void, T | PromiseLike<T>>, opts?: Partial<ErrOptions>): Promise<ProcessingResult<T>> {
        try {
            const res = await func();
            return { result: res };
        } catch(e) {
            return { result: null as T, message: Err._processException(e, opts)};
        }
    }

    private static _processException(e: Error, opts?: Partial<ErrOptions>): string {
        opts ??= {};
        opts.verbosity ??= 'short';
        opts.errLevel ??= 'warn';
        opts.logger ??= aftLogger;
        const err = new Err(e)
            .setVerbosity(opts.verbosity);
        const message = err.toString();
        if (opts.errLevel !== 'none') {
            opts.logger.log({
                name: Err.name,
                message,
                level: opts.errLevel 
            });
        }
        return message
    }
}
