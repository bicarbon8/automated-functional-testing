import * as Mocha from 'mocha';
import { AftTest } from './aft-test';
import { AftConfig, Err, aftConfig } from 'aft-core';

const {
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_TEST_PENDING
} = Mocha.Runner.constants;

export class AftMochaReporterConfig {
    enabled: boolean = true;
}

/**
 * this reporter integrates the Automated Functional Testing (AFT)
 * library into Mocha
 */
export class AftMochaReporter extends Mocha.reporters.Base {
    private readonly _cfg: AftMochaReporterConfig;

    private _aftCfg: AftConfig;

    constructor(runner: Mocha.Runner) {
        super(runner);
        this._cfg = this.aftCfg.getSection(AftMochaReporterConfig);
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
        .on(EVENT_TEST_PENDING, async (test: Mocha.Test) => {
            // always handle when test is manually skipped using `xit` or `xdescribe`
            const t = new AftTest({test});
            await t.pending();
            await t.dispose();
        })
        .on(EVENT_TEST_PASS, async (test: Mocha.Test) => {
            // conditionally handle `passing` test when not using AFT Verifier
            if (this._cfg.enabled === true) {
                const t = new AftTest({test});
                await t.pass();
                await t.dispose();
            }
        })
        .on(EVENT_TEST_FAIL, async (test: Mocha.Test, err: any) => {
            // conditionally handle `failing` test when not using AFT Verifier
            if (this._cfg.enabled === true) {
                const t = new AftTest({test});
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
