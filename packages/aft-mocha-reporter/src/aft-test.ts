import { AftConfig, Verifier, Class, AftTestIntegration } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftTestIntegration {
    public readonly test: Mocha.Test;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        this.test = scope?.test || {};
    }

    /**
     * the value from `Mocha.Test.fullTitle()`
     */
    override get fullName(): string {
        try {
            return this.test?.fullTitle();
        } catch (e) {
            return 'unknown';
        }
    }

    protected override _getVerifier<T extends Verifier>(verifierType?: Class<T>): T {
        return super._getVerifier(verifierType)
            .on('skipped', () => this.test.skip()) as T;
    }
}