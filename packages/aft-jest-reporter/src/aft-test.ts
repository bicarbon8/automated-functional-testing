import { AftConfig, FileSystemMap, AftTestIntegration, convert } from "aft-core";
import AftJestReporter from "./aft-jest-reporter";
import { TestCaseResult } from "@jest/reporters";

/**
 * provides a more streamlined means of getting a `Verifier`
 * from the Mocha test context
 */
export class AftTest extends AftTestIntegration {
    private readonly _fsMap: FileSystemMap<string, Omit<TestCaseResult, 'failureDetails'>>;

    public readonly test: TestCaseResult;

    /**
     * expects to be passed the scope from an executing Mocha
     * test (i.e. the `this` argument)
     * @param scope the `this` scope from within a Mocha `it`
     */
    constructor(scope?: any, aftCfg?: AftConfig) {
        super(scope, aftCfg);
        this._fsMap = new FileSystemMap<string, Omit<TestCaseResult, 'failureDetails'>>('AftJestReporter', [], this.aftCfg);
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

    override async pass(): Promise<void> {
        this._fsMap.set(this.fullName, {
            fullName: this.fullName,
            numPassingAsserts: 1,
            status: 'passed',
            duration: this.test.duration,
            failureMessages: undefined,
            ancestorTitles: undefined,
            title: undefined
        });
        await this._logResult('passed');
    }

    override async fail(reason?: string): Promise<void> {
        let err: string = reason ?? 'unknown error occurred';
        if (this.test) {
            err = this.test.failureMessages?.join('\n') ?? err;
        }
        this._fsMap.set(this.fullName, {
            fullName: this.fullName,
            numPassingAsserts: 0,
            status: 'failed',
            duration: this.test.duration,
            failureMessages: err?.split('\n'),
            ancestorTitles: undefined,
            title: undefined
        });
        await this._logResult('failed', err);
    }

    /**
     * see: `pending`
     * @param reason the reason for skipping this test
     */
    async skipped(reason?: string): Promise<void> {
        await this.pending(reason);
    }
    /**
     * marks the test as skipped in all downstream reporting
     * @param message the reason for skipping this test
     */
    override async pending(message?: string): Promise<void> {
        message ??= 'test skipped';
        this._fsMap.set(this.fullName, {
            fullName: this.fullName,
            numPassingAsserts: 0,
            status: 'skipped',
            duration: this.test.duration,
            failureMessages: [message],
            ancestorTitles: undefined,
            title: undefined
        });
        await this._logResult('skipped', message);
    }
}