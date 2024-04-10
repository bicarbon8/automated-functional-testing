import jasmine = require("jasmine");
import { AftTest, AftTestOptions, FileSystemMap, Func } from "aft-core";
import { CurrentlyExecutingTestMap } from "./aft-jasmine-constants";

/**
 * when running inside the Jasmine Reporter Plugin a valid scope will
 * be available, but when running inside a Jasmine test the scope is 
 * not available and should be left unset (`null` or `undefined`)
 * @param scope a value of `null` or `undefined` when run inside a
 * Jasmine `it` function or a value like `{test: Jasmine.SpecResult}`
 * when called inside a Jasmine Reporter
 */
export class AftJasmineTest extends AftTest {
    /**
     * reference to the jasmine.SpecResult
     * > NOTE: this is only set from inside the Jasmine
     * Reporter plugin and not available within a
     * Jasmine `it` function
     */
    public readonly test: jasmine.SpecResult;
    
    constructor(scope?: any, testFunction?: Func<AftTest, void | PromiseLike<void>>, options?: AftTestOptions) {
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
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        super(fullName, testFunction, options);
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

/**
 * creates a new `AftJasmineTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * await aftJasmineTest('[C1234] example usage for AftTest', async (v: AftJasmineTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 * @param description a string describing the test
 * @param testFunction the `Func<AftJasmineTest, void | PromiseLike<void>>` function to be
 * executed by this `AftJasmineTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftJasmineTest = async (assertion: Func<AftJasmineTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<void> => {
    return new AftJasmineTest(null, assertion, options).run();
};
