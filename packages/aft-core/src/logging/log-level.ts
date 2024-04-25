const levels = ['trace', 'debug', 'info', 'step', 'warn', 'pass', 'fail', 'error', 'none'] as const;
export type LogLevel = typeof levels[number];

/**
 * allows for filtering out of erroneous information from logs by assigning
 * values to different types of logging. the purpose of each log level is
 * as follows:
 * - `trace` - used by AFT internal systems or debug events that would be very chatty (for ex: occur within a loop)
 * - `debug` - used for debug logging that does not run within a loop or at a high frequency
 * - `info` - used for informational events providing current state of a system
 * - `step` - used within a test to denote where within the test steps we are
 * - `warn` - used for unexpected errors that are recoverable
 * - `pass` - used to indicate the success of a test expectation or assertion
 * - `fail` - used to indicate the failure of a test expectation or assertion
 * - `error` - used for unexpected errors that are **not** recoverable
 * - `none` - used when no logging is desired (disables logging)
 */
export namespace LogLevel { // eslint-disable-line no-redeclare
    /**
     * indicates whether a value is a valid `LogLevel` or not
     * @param level some value that may or may not be a `LogLevel`
     * @returns `true` if the passed in value is a valid `LogLevel`
     * otherwise `false`
     */
    export function isType(level: unknown): level is LogLevel {
        return typeof level === 'string' && levels.includes(level as LogLevel);
    }

    /**
     * converts the passed in string to a `LogLevel` number that can be
     * used to compare to other levels (higher numbers have higher
     * precedence and would be allowed to pass through if the `LogLevel`
     * were set to the same or lower value)
     * @param level a string that may or may not be of type `LogLevel`
     * @returns the integer value of the `LogLevel` or `LogLevel` `none`
     */
    export function toValue(level: string): number {
        if (level) {
            if (LogLevel.isType(level)) {
                return levels.indexOf(level);
            }
        }
        return levels.length - 1;
    }
}
