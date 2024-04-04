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
    constructor(scope?: any) {
        let test: TestCaseResult;
        let fullName: string;
        if (typeof scope === 'string') {
            fullName = scope;
        }else if (scope?.['fullName']) {
            // 'scope' is a 'TestCaseResult'
            test = scope;
            fullName = test.fullName;
        } else if (scope?.getState) {
            // 'scope' is an 'expect' object
            const state = scope.getState();
            fullName = state.currentTestName;
        }
        super(fullName);
        this.internals.withResultsCaching();
        this.test = test;
    }

    override async fail(reason?: string): Promise<void> {
        let err: string = reason ?? 'unknown error occurred';
        if (this.test) {
            err = this.test.failureMessages?.join('\n') ?? err;
        }
        await super.fail(err);
        fail(err);
    }

    override async pending(message?: string): Promise<void> {
        await super.pending(message);
        pending(message);
    }

    /**
     * see: `pending`
     * @param reason the reason for skipping this test
     */
    async skipped(reason?: string): Promise<void> {
        return this.pending(reason);
    }
}