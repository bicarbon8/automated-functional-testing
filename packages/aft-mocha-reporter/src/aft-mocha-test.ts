import Mocha = require("mocha");
import { AftTest, AftTestOptions, Func } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
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
    constructor(scope?: any, testFunction?: Func<AftTest, void | PromiseLike<void>>, options?: AftTestOptions) {
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        super(scope?.test?.fullTitle(), testFunction, options);
        this.test = scope?.test;
    }

    override async pending(message?: string): Promise<void> {
        await super.pending(message);
        this.test?.skip?.();
    }
}

export const aftMochaTest = async (description: Mocha.Context | string, assertion: Func<AftMochaTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<void> => {
    return new AftMochaTest(description, assertion, options).run();
};
