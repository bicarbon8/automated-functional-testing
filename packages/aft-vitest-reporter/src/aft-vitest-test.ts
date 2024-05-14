import { TaskContext, Test } from "vitest";
import { AftTest, AftTestFunction, AftTestOptions, Func, TestResult, TestStatus, rand } from "aft-core";

/**
 * expects to be passed the context from an executing Vitest
 * task (i.e. the `ctx` argument)
 * #### NOTE:
 * > 
 * > the Vitest `ctx` context is only available when tests
 * are written using
 * > 
 * > `it('description', function(ctx) {...})`
 * >
 * > or `it('description', (ctx) => {...})`
 * >
 * > and _not_ when using
 * >
 * > `it('description', () => {...})`
 * >
 * > or `it('description', function() => {...})`
 * >
 * @param context the `ctx` context object passed to a Vitest `it`
 */
export class AftVitestTest extends AftTest {
    /**
     * an instance of a `Vitest.Context` from the `ctx` context
     * passed to a Vitest `it` function as an argument
     * `ctx`
     * #### NOTE:
     * > if no `ctx` argument is passed to your `it`
     * function this will not be available
     */
    public readonly test: Test;

    constructor(context?: any, testFunction?: AftTestFunction, options?: AftTestOptions) {
        testFunction ??= () => null;
        options ??= {};
        options.cacheResultsToFile = true;
        let description: string;
        if (context?.task?.type === 'test') {
            description = `${context.task.suite?.name} ${context.task.name}`;
        } else if (typeof context === 'string') {
            description = context;
        } else {
            description = `${AftVitestTest.name}_${rand.getString(8, true, true)}`;
        }
        super(description, testFunction, options);
        this.test = (context?.task) ? context.task : null;
    }

    override async pending(message?: string, ...testIds: Array<string>): Promise<void> {
        await super.pending(message, ...testIds);
        this.test?.context?.skip?.();
    }

    protected override async _generateTestResult(status: TestStatus, resultMessage: string, testId?: string): Promise<TestResult> {
        const result = await super._generateTestResult(status, resultMessage, testId);
        if (result?.metadata?.['durationMs'] && this.test?.result?.duration > 0) {
            result.metadata['durationMs'] = this.test.result.duration;
        }
        return result;
    }
}

/**
 * creates a new `AftVitestTest` instace to be used for executing some Functional
 * Test Assertion and calls the `run` function to execute the `testFunction`.
 * 
 * ex:
 * ```typescript
 * it('[C1234] example usage for AftTest', async (ctx) => {
 *     await AftVitestTest(ctx, async (v: AftVitestTest) => {
 *        await v.reporter.info('doing some testing...');
 *        const feature = new FeatureObj();
 *        await v.verify(() => feature.returnExpectedValueAsync(), equaling('expected value'));
 *     }); // if PolicyManager.shouldRun('C1234') returns `false` the assertion is not run
 * })
 * ```
 * @param context a `ctx` representing the current `Vitest` instance containing the
 * `Vitest.Task` used to get the test description or a `string` description
 * @param testFunction the `Func<AftVitestTest, void | PromiseLike<void>>` function to be
 * executed by this `AftVitestTest`
 * @param options an optional `AftTestOptions` object containing overrides to internal
 * configuration and settings
 * @returns an async `Promise<void>` that runs the passed in `testFunction`
 */
export const aftVitestTest = async (context: TaskContext | string, testFunction: Func<AftVitestTest, void | PromiseLike<void>>, options?: AftTestOptions): Promise<AftVitestTest> => {
    return new AftVitestTest(context, testFunction, options).run();
};
