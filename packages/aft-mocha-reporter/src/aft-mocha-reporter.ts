import * as Mocha from 'mocha';
import { AftMochaTest } from './aft-mocha-test';
import { AftConfig, Err, FileSystemMap, aftConfig } from 'aft-core';

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
        /** 
         * NOTE: Mocha events happen out of order for async tests so we cannot rely on 
         * `EVENT_TEST_BEGIN` and run `AftMochaTest.shouldRun` to skip test before entering
         * the `it` function
         */
        runner
        .on(EVENT_RUN_BEGIN, () => {
            // clear all previously cached test results
            FileSystemMap.removeCacheFile(AftMochaTest.name);
        })
        .on(EVENT_TEST_PENDING, async (test: Mocha.Test) => {
            /**
             * conditionally handle `pending` test when not using AFT Verifier
             * NOTE: always handles when test is manually skipped using `xit` or `xdescribe`
             */
            const t = new AftMochaTest({test});
            if (t.getResults().length === 0) {
                await t.pending();
            }
        })
        .on(EVENT_TEST_PASS, async (test: Mocha.Test) => {
            // conditionally handle `passing` test when not using AFT Verifier
            const t = new AftMochaTest({test});
            if (t.getResults().length === 0) {
                await t.pass();
            }
        })
        .on(EVENT_TEST_FAIL, async (test: Mocha.Test, err: any) => {
            // conditionally handle `failing` test when not using AFT Verifier
            const t = new AftMochaTest({test});
            if (t.getResults().length === 0) {
                if (typeof err !== 'string') {
                    const handled = Err.handle(() => JSON.stringify(err))
                    err = handled?.result ?? handled?.message;
                }
                await t.fail(err);
            }
        });
    }
}

module.exports = AftMochaReporter; // eslint-disable-line no-undef
