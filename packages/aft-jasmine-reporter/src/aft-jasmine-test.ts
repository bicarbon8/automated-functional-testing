import jasmine = require("jasmine");
import { AftConfig, Verifier, AftTest, FileSystemMap } from "aft-core";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Jasmine test context
 */
export class AftJasmineTest extends AftTest {
    public readonly test: jasmine.SpecResult;
    
    /**
     * when running inside the Jasmine Reporter Plugin a valid scope will
     * be available, but when running inside a Jasmine test the scope is 
     * not available and should be left unset
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        const testNames = new FileSystemMap<string, any>('AftJasmineReporter', [], aftCfg);
        if (!scope) {
            const names: Array<string> = Array.from(testNames.keys());
            scope = (names?.length > 0) ? names[0] : undefined;
        }
        if (typeof scope === 'string') {
            scope = {test: {fullName: scope}};
        }
        super(scope, aftCfg);
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
        await super.fail(err);
    }

    override async pending(message?: string): Promise<void> {
        await super.pending(message);
        pending();
    }
}