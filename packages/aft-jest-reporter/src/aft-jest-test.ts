import { JestExpect } from "@jest/expect";
import { AftTest, AftTestFunction, AftTestOptions, Func, TestResult, TestStatus, rand } from "aft-core";
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
     * #### NOTE:
     * > this is only set from inside the Jest
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

    /**
     * see: `pending`
     * @param reason the reason for skipping this test
     */
    async skipped(reason?: string): Promise<void> {
        return this.pending(reason);
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
 * creates a new `AftJestTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * test('[C1234] example usage for AftTest', () => {
 *     await aftJestTest(expect, async (v: AftJestTest) => {
 *        await v.reporter.info('doing some testing...');
 *        const feature = new FeatureObj();
 *        await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 *     }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * })
 * ```
 * @param expect a `JestExpect` or `jest.Expect` containing a `fullName` property used
 * as the test description or a `string` description
 * @param testFunction the `Func<AftJestTest, void | PromiseLike<void>>` function to be
 * executed by this `AftJestTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftJestTest = async (expect: JestExpect | jest.Expect | string, testFunction: Func<AftJestTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<AftJestTest> => {  // eslint-disable-line no-undef
    return new AftJestTest(expect, testFunction, options).run();
};
