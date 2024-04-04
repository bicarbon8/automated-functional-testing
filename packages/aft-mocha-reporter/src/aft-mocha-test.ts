import Mocha = require("mocha");
import { AftTest } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftMochaTest extends AftTest {
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
    constructor(scope?: any) {
        super(scope.test?.fullTitle());
        this.test = scope?.test || {};
    }

    override async pending(message?: string): Promise<void> {
        await super.pending(message);
        this.test.skip();
    }
}