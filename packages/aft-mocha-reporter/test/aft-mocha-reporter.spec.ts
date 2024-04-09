import { expect } from "chai";
import { AftMochaTest } from "../src";
import * as sinon from "sinon";
import { AftTest, equivalent } from "aft-core";

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
        expect(t.reporter.loggerName).to.equal(t.fullName);

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

    it('provides a Verifier instance for use in test control', async function() {
        this.timeout(10000);
        const t = new AftMochaTest(this);
        await t.verify(async (v: AftTest) => {
            await v.reporter.info('returning logName');
            return v.reporter.loggerName;
        }).returns(equivalent(t.reporter.loggerName));
    });
});
