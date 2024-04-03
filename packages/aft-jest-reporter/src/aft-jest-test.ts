import { AftConfig, AftTest, convert } from "aft-core";
import { TestCaseResult } from "@jest/reporters";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftJestTest extends AftTest {
    public readonly test: TestCaseResult;

    /**
     * expects to be passed the scope from an executing Jest
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Jest `test`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        if (typeof scope === 'string') {
            this.test = {
                fullName: scope,
                get duration(): number { return convert.toElapsedMs(this.startTime) / 1000; }
            } as TestCaseResult;
        }else if (scope?.['fullName']) {
            // 'scope' is a 'TestCaseResult'
            this.test = scope;
        } else if (scope?.getState?.()) {
            // 'scope' is an 'expect' object
            const state = scope.getState();
            this.test = {
                fullName: state.currentTestName,
                get duration(): number { return convert.toElapsedMs(this.startTime) / 1000; }
            } as TestCaseResult;
        }
    }

    /**
     * the value from `jest.TestCaseResult.fullName`
     */
    override get fullName(): string {
        return this.test?.fullName ?? 'unknown';
    }

    override async fail(reason?: string): Promise<void> {
        let err: string = reason ?? 'unknown error occurred';
        if (this.test) {
            err = this.test.failureMessages?.join('\n') ?? err;
        }
        await this._logResult('failed', err);
    }

    /**
     * see: `pending`
     * @param reason the reason for skipping this test
     */
    async skipped(reason?: string): Promise<void> {
        await this.pending(reason);
    }
}