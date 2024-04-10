import { JestExpect } from "@jest/expect";
import { AftTest, AftTestFunction, AftTestOptions, Func, rand } from "aft-core";
import { TestCaseResult } from "@jest/reporters";

/**
 * expects to be passed a context scope from an executing Jest
 * test. for Jest, the `JestExpect` type contains this so you
 * can use an `expect` like follows:
 * 
 * ```typescript
 * test('perform some testing', () => {
 *     const t = new AftJestTest(expect, () => doStuff());
 * })
 * ```
 * @param scope the `expect` object from within a Jest `test`
 */
export class AftJestTest extends AftTest {
    /**
     * reference to the Jest.TestCaseResult
     * > NOTE: this is only set from inside the Jest
     * Reporter plugin and not available within a
     * Jest `test` function
     */
    public readonly test: TestCaseResult;

    /**
     * expects to be passed a context scope from an executing Jest
     * test. for Jest, the `JestExpect` type contains this so you
     * can use an `expect` like follows:
     * 
     * ```typescript
     * test('perform some testing', () => {
     *     const t = new AftJestTest(expect, () => doStuff());
     * })
     * ```
     * @param scope the `expect` object from within a Jest `test`
     */
    constructor(scope?: any, testFunction?: AftTestFunction, options?: AftTestOptions) {
        let test: TestCaseResult;
        let description: string;
        if (typeof scope === 'string') {
            description = scope;
        }else if (scope?.fullName) {
            // 'scope' is a 'TestCaseResult'
            test = scope;
            description = test.fullName;
        } else if (scope?.getState) {
            // 'scope' is an 'expect' object
            const state = scope.getState();
            description = state.currentTestName;
        } else {
            description = `${AftJestTest.name}_${rand.getString(8, true, true)}`;
        }
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        super(description, testFunction, options);
        this.test = test;
    }

    override async fail(reason?: string, ...testIds: Array<string>): Promise<void> {
        let err: string = reason ?? 'unknown error occurred';
        if (this.test) {
            err = this.test.failureMessages?.join('\n') ?? err;
        }
        await super.fail(err, ...testIds);
        fail(err); // eslint-disable-line no-undef
    }

    /**
     * see: `pending`
     * @param reason the reason for skipping this test
     */
    async skipped(reason?: string, ...testIds: Array<string>): Promise<void> {
        return this.pending(reason, ...testIds);
    }
}

/**
 * creates a new `AftJestTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * await aftJestTest('[C1234] example usage for AftTest', async (v: AftJestTest) => {
 *   await v.reporter.info('doing some testing...');
 *   const feature = new FeatureObj();
 *   await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 * }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * ```
 * @param description a string describing the test
 * @param testFunction the `Func<AftJestTest, void | PromiseLike<void>>` function to be
 * executed by this `AftJestTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftJestTest = async (description: JestExpect | jest.Expect | string, assertion: Func<AftJestTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<void> => {  // eslint-disable-line no-undef
    return new AftJestTest(description, assertion, options).run();
};
