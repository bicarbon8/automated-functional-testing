/**
 * a retry back-off delay type where `constant` uses the same
 * delay each time, `linear` adds the start delay to the previous
 * on each iteration and `exponential` doubles the previous delay
 */
export type Delay = 'constant' | 'linear' | 'exponential';

export module Delay {
    /**
     * calculates the next millisecond delay to use based on a specified
     * `Delay` type and the first and last used delays. useful in retry
     * with back-off implementations
     * @param start number of millisecond delay used at the start
     * @param current number of millisecond delay last used
     * @param type the `Delay` type in use
     * @returns the number of milliseconds delay to use for the current iteration
     */
    export function getNext(start: number, current: number, type: Delay): number {
        switch (type) {
            case 'linear':
                return current + start;
            case 'exponential':
                return current * 2;
            case 'constant':
            default:
                return current;
        }
    }

    /**
     * converts the passed in seconds to milliseconds
     * @param seconds the number of seconds
     * @returns the number of milliseconds in the passed
     * in `seconds`
     */
    export function fromSeconds(seconds: number): number {
        return seconds * 1000;
    }

    /**
     * converts the passed in minutes to milliseconds
     * @param minutes the number of minutes
     * @returns the number of milliseconds in the passed in
     * `minutes`
     */
    export function fromMinutes(minutes: number): number {
        return Delay.fromSeconds(minutes * 60);
    }
}