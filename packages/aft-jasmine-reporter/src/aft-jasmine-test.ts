import jasmine = require("jasmine");
import { AftTest, AftTestFunction, AftTestOptions, FileSystemMap, Func, TestResult, TestStatus, rand } from "aft-core";
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
     * #### NOTE:
     * > this is only set from inside the Jasmine
     * Reporter plugin and not available within a
     * Jasmine `it` function
     */
    public readonly test: jasmine.SpecResult;
    
    constructor(scope?: any, testFunction?: AftTestFunction, options?: AftTestOptions) {
        let description: string;
        if (!scope) {
            const testNames = new FileSystemMap<string, boolean>(CurrentlyExecutingTestMap);
            const names: Array<string> = Array.from(testNames.keys());
            description = (names?.length > 0) ? names[0] : undefined;
        } else {
            if (typeof scope === 'string') {
                description = scope;
            } else if (scope?.fullName) {
                // `scope` is a `SpecResult`
                description = scope?.fullName;
            } else {
                // something went wrong
                description = `${AftJasmineTest.name}_${rand.getString(8, true, true)}`;
            }
        }
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        super(description, testFunction, options);
        this.test = scope;
    }

    override async pending(message?: string): Promise<void> {
        pending(message); // eslint-disable-line no-undef
        await super.pending(message);
    }

    protected override async _generateTestResult(status: TestStatus, resultMessage: string, testId?: string): Promise<TestResult> {
        const result = await super._generateTestResult(status, resultMessage, testId);
        if (result?.metadata?.['durationMs'] && this.test?.duration > 0) {
            result.metadata['durationMs'] = this.test.duration;
        }
        return result;
    }
}

/**
 * creates a new `AftJasmineTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * it('[C1234] example usage for AftTest', () => {
 *     await aftJasmineTest(async (v: AftJasmineTest) => {
 *         await v.reporter.info('doing some testing...');
 *         const feature = new FeatureObj();
 *         await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 *     }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * })
 * ```
 * @param testFunction the `Func<AftJasmineTest, void | PromiseLike<void>>` function to be
 * executed by this `AftJasmineTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftJasmineTest = async (testFunction: Func<AftJasmineTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<AftJasmineTest> => {
    return new AftJasmineTest(null, testFunction, options).run();
};
