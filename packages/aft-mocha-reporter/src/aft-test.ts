import Mocha = require("mocha");
import { AftConfig, Verifier, AftTestIntegration } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftTestIntegration {
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
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope.test?.fullTitle(), aftCfg);
        this.test = scope?.test || {};
    }

    protected override _getVerifier(): Verifier {
        return super._getVerifier()
            .on('skipped', () => this.test.skip());
    }
}