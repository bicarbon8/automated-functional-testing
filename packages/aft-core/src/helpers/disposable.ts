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