import { Func } from "./custom-types";
import { Disposable } from "./disposable";

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
        await Promise.resolve(func(disposable));
    } catch (e) {
        err = e;
        throw e; // don't trap the Error
    } finally {
        disposable?.dispose(err);
    }
}