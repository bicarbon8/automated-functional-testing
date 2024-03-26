import * as Mocha from 'mocha';
import { AftTest } from './aft-test';

const {
    EVENT_TEST_FAIL,
    EVENT_TEST_PASS,
    EVENT_TEST_PENDING
} = Mocha.Runner.constants;

/**
 * this reporter integrates the Automated Functional Testing (AFT)
 * library into Mocha
 */
export class AftMochaReporter extends Mocha.reporters.Base {
    constructor(runner: Mocha.Runner) {
        super(runner);
        this.addListeners(runner);
    }

    addListeners(runner: Mocha.Runner): void {
        runner
        .on(EVENT_TEST_PENDING, async (test: Mocha.Test) => {
            const t = new AftTest({test: test});
            await t.pending();
            await t.dispose();
        })
        .on(EVENT_TEST_PASS, async (test: Mocha.Test) => {
            const t = new AftTest({test: test});
            await t.pass();
            await t.dispose();
        })
        .on(EVENT_TEST_FAIL, async (test: Mocha.Test, err: any) => {
            const t = new AftTest({test: test});
            await t.fail(err);
            await t.dispose();
        });
    }
}

module.exports = AftMochaReporter; // eslint-disable-line no-undef