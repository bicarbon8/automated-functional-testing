import jasmine = require("jasmine");
import { AftConfig, Verifier, Class, AftTestIntegration, FileSystemMap } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Jasmine test context
 */
export class AftTest extends AftTestIntegration {
    public readonly test: jasmine.SpecResult;
    
    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        const testNames = new FileSystemMap<string, any>('AftJasmineReporter', [], this.aftCfg);
        if (!scope) {
            const names: Array<string> = Array.from(testNames.keys());
            scope = (names?.length > 0) ? names[0] : undefined;
        }
        if (typeof scope === 'string') {
            scope = {test: {fullName: scope}};
        }
        this.test = scope?.test || {};
    }

    /**
     * the value from `jasmine.SpecResult.fullName`
     */
    override get fullName(): string {
        return this.test?.fullName ?? 'unknown';
    }

    override async fail(message?: string): Promise<void> {
        let err: string = message ?? 'unknown error occurred';
        if (this.test?.failedExpectations) {
            err = this.test.failedExpectations.map(e => `${e.message}\n${e.stack}`).join('\n');
        }
        await this._logResult('failed', err);
    }

    protected override _getVerifier<T extends Verifier>(verifierType?: Class<T>): T {
        return super._getVerifier(verifierType)
            .on('skipped', () => pending()) as T; // eslint-disable-line no-undef
    }
}