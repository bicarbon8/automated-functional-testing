import Mocha = require("mocha");
import { AftTest, AftTestFunction, AftTestOptions, Func, rand } from "aft-core";

/**
 * expects to be passed the scope from an executing Mocha
 * test (i.e. the `this` argument)
 * > **NOTE:**
 * > 
 * > the Mocha `this` scope is only available when tests
 * are written using
 * > 
 * > `it('description', function() {...})`
 * >
 * > and _not_ when using
 * >
 * > `it('description', () => {...})`
 * >
 * @param scope the `this` scope from within a Mocha `it`
 */
export class AftMochaTest extends AftTest {
    /**
     * an instance of a `Mocha.Test` from the `this` scope
     * from within a Mocha `it` function taken from
     * `this.test`
     * > NOTE: if using an arrow function in your `it`
     * this will not be set
     */
    public readonly test: Mocha.Test;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * > **NOTE:**
     * > 
     * > the Mocha `this` scope is only available when tests
     * are written using
     * > 
     * > `it('description', function() {...})`
     * >
     * > and _not_ when using
     * >
     * > `it('description', () => {...})`
     * >
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, testFunction?: AftTestFunction, options?: AftTestOptions) {
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        const description = scope?.test?.fullTitle() ?? `${AftMochaTest.name}_${rand.getString(8, true, true)}`;
        super(description, testFunction, options);
        this.test = scope?.test;
    }

    override async pending(message?: string, ...testIds: Array<string>): Promise<void> {
        await super.pending(message, ...testIds);
        this.test?.skip?.();
    }
}

/**
 * creates a new `AftMochaTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * await aftMochaTest('[C1234] example usage for AftTest', async (v: AftMochaTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 * @param description a string describing the test
 * @param testFunction the `Func<AftMochaTest, void | PromiseLike<void>>` function to be
 * executed by this `AftMochaTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftMochaTest = async (description: Mocha.Context | string, assertion: Func<AftMochaTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<void> => {
    return new AftMochaTest(description, assertion, options).run();
};
