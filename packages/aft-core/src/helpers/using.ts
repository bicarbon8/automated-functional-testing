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
    dispose(error?: any): void;
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
    await Promise.resolve(disposable) // pass the disposable
    .then(func)                       // to the func like func(disposable)
    .catch((e) => {                   // catch any Error and reject
        err = e;
        return Promise.reject(e);
    })                                // and then dispose with any Error
    .finally(() => disposable?.dispose(err));
}
