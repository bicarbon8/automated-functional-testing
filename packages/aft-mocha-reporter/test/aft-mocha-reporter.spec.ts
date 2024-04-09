import { expect } from "chai";
import { AftMochaTest, aftMochaTest } from "../src";
import * as sinon from "sinon";
import { AftTest, containing, equivalent } from "aft-core";

describe('AftMochaReporter', () => {
    it('passes a Mocha Test to the test that can be used by AftMochaTest', async function () {
        this.timeout(10000);
        const t = new AftMochaTest(this);
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) { 
            await t.pending(shouldRun.message);
        }
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.reporter.loggerName).to.equal(t.description);

        await t.reporter.trace('sample log message');
    });

    it('can skip a test during execution', async function() {
        this.timeout(10000);
        const t = new AftMochaTest(this);
        sinon.stub(t, 'shouldRun').callsFake(() => Promise.resolve({result: false, message: 'fake'}));
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) { 
            await t.pending(shouldRun.message);
        }
        
        expect(true).to.be.false;
    });

    it('still works if using an arrow function', async () => {
        const t = new AftMochaTest(this);
        
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.reporter.loggerName).to.contain(AftMochaTest.name);
        
        // NOTE: arrow functions have no `this` so `this.test.fullTitle` doesn't exist
        // expect(t.reporter.logName).to.equal(t.fullTitle);

        await t.reporter.trace('sample log message from aft-mocha-reporter.spec with arrow function');
    });

    it('[C1234] provides a Verifier instance for use in test control', async function() {
        this.timeout(10000);
        await aftMochaTest(this, async (v: AftTest) => {
            await v.verify(v.description, 'AftMochaReporter [C1234] provides a Verifier instance for use in test control');
            await v.verify(v.testIds, containing('C1234'), 'expected to parse test ID from description');
        });
    });
});
