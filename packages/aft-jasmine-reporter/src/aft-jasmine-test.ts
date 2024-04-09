import jasmine = require("jasmine");
import { AftTest, FileSystemMap } from "aft-core";
import { CurrentlyExecutingTestMap } from "./aft-jasmine-constants";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Jasmine test context
 */
export class AftJasmineTest extends AftTest {
    /**
     * reference to the jasmine.SpecResult
     * > NOTE: this is only set from inside the Jasmine
     * Reporter plugin and not available within a
     * Jasmine `it` function
     */
    public readonly test: jasmine.SpecResult;
    
    /**
     * when running inside the Jasmine Reporter Plugin a valid scope will
     * be available, but when running inside a Jasmine test the scope is 
     * not available and should be left unset
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any) {
        let fullName: string;
        if (!scope) {
            const testNames = new FileSystemMap<string, any>(CurrentlyExecutingTestMap);
            const names: Array<string> = Array.from(testNames.keys());
            fullName = (names?.length > 0) ? names[0] : undefined;
        } else {
            if (typeof scope === 'string') {
                fullName = scope;
            } else {
                fullName = scope?.test?.fullName;
            }
        }
        super(fullName);
        this.internals.withFileSystemCache(); // eslint-disable-line
        this.test = scope?.test;
    }

    override async fail(message?: string): Promise<void> {
        let err: string = message ?? 'unknown error occurred';
        if (this.test?.failedExpectations?.length) {
            err = this.test.failedExpectations.map(e => `${e.message}\n${e.stack}`).join('\n');
        }
        await super.fail(err);
    }

    override async pending(message?: string): Promise<void> {
        await super.pending(message);
        pending(); // eslint-disable-line no-undef
    }
}
