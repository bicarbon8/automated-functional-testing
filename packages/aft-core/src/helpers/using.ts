import { Func } from "./custom-types";

/**
 * interface should be implemented by classes that require
 * some disposal after their use. automatic disposal is
 * handled by using the `Disposable` within the `using`
 * object like follows:
 * ```
 * async using(new ImplementsDisposable(), async (disp) => {
 *     await disp.doSomethingAsync();
 *     disp.doSomethingSync();
 * });
 * ```
 * where the `dispose` function would be called
 * automatically upon completion or in the case of an
 * Error
 */
export interface Disposable {
    dispose(error?: any): Promise<void>; // eslint-disable-line no-unused-vars
}

/**
 * function will execute a passed in function passing in the supplied `Disposable`
 * and then calling the `dispose` method on the `Disposable` when execution of the 
 * function is done.
 * Usage Example:
 * ```
 * await using(new ImplementsDisposable(), async (disposable) => {
 *   await disposable.interact();
 *   // do stuff...
 * }); // `disposable.dispose` is called here
 * ```
 * @param disposable object implementing the `Disposable` interface
 * @param func a function to be passed the `Disposable` for use before disposal
 */
export async function using<T extends Disposable>(disposable: T, func: Func<T, void | Promise<void>>): Promise<void> {
    let err: any;
    try {
        await Promise.resolve(func(disposable)); // pass `disposable` to the func like func(disposable)
    } catch(e) {                                 // catch any Error, store it and re-throw
        err = e;
        throw e;
    } finally {
        await disposable?.dispose(err);          // and then dispose with any Error
    }
}
