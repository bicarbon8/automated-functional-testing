import * as Mocha from 'mocha';
import { AftTest } from './aft-test';
import { AftConfig, Err, aftConfig } from 'aft-core';

const {
    EVENT_RUN_BEGIN,
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_TEST_PENDING
} = Mocha.Runner.constants;

/**
 * this reporter integrates the Automated Functional Testing (AFT)
 * library into Mocha
 */
export class AftMochaReporter extends Mocha.reporters.Base {
    private _aftCfg: AftConfig;

    constructor(runner: Mocha.Runner) {
        super(runner);
        this.addListeners(runner);
    }

    get aftCfg(): AftConfig {
        if (!this._aftCfg) {
            this._aftCfg = aftConfig;
        }
        return this._aftCfg;
    }

    set aftCfg(aftCfg: AftConfig) {
        this._aftCfg = aftCfg;
    }

    addListeners(runner: Mocha.Runner): void {
        runner
        .on(EVENT_RUN_BEGIN, () => {
            // clear all previously cached test results
            AftTest.clearCache();
        })
        .on(EVENT_TEST_PENDING, async (test: Mocha.Test) => {
            // always handle when test is manually skipped using `xit` or `xdescribe`
            const t = new AftTest({test});
            if (t.getCachedResults(t.fullName).length === 0) {
                await t.pending();
                await t.dispose();
            }
        })
        .on(EVENT_TEST_PASS, async (test: Mocha.Test) => {
            // conditionally handle `passing` test when not using AFT Verifier
            const t = new AftTest({test});
            if (t.getCachedResults(t.fullName).length === 0) {
                await t.pass();
                await t.dispose();
            }
        })
        .on(EVENT_TEST_FAIL, async (test: Mocha.Test, err: any) => {
            // conditionally handle `failing` test when not using AFT Verifier
            const t = new AftTest({test});
            if (t.getCachedResults(t.fullName).length === 0) {
                if (typeof err !== 'string') {
                    err = Err.handle(() => JSON.stringify(err));
                }
                await t.fail(err);
                await t.dispose();
            }
        });
    }
}

module.exports = AftMochaReporter; // eslint-disable-line no-undef
