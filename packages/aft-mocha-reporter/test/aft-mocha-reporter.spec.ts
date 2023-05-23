import { expect } from "chai";
import { AftTest } from "../src";
import * as sinon from "sinon";
import { Verifier, equaling } from "aft-core";

describe('AftMochaReporter', () => {
    it('passes a Mocha Test to the test that can be used by AftTest', async function () {
        this.timeout(10000);
        const t = new AftTest(this);
        const shouldRun = await t.shouldRun();
        if (!shouldRun) { 
            t.test.skip();
        }
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.reporter.reporterName).to.equal(t.fullName);

        await t.reporter.trace('sample log message');
    });

    it('can skip a test during execution', async function() {
        this.timeout(10000);
        const t = new AftTest(this);
        sinon.stub(t, 'shouldRun').callsFake(() => Promise.resolve(false));
        const shouldRun = await t.shouldRun();
        if (!shouldRun) { 
            t.test.skip();
        }
        
        expect(true).to.be.false;
    });

    it('still works if using an arrow function', async () => {
        const t = new AftTest(this);
        
        expect(t).to.exist;
        expect(t.reporter).to.exist;
        expect(t.reporter.reporterName).to.eql('AFT');
        
        // NOTE: arrow functions have no `this` so `this.test.fullTitle` doesn't exist
        // expect(t.reporter.logName).to.equal(t.fullTitle);

        await t.reporter.trace('sample log message from aft-mocha-reporter.spec with arrow function');
    });

    it('provides a Verifier instance for use in test control', async function() {
        this.timeout(10000);
        const t = new AftTest(this);
        await t.verify(async (v: Verifier) => {
            await v.reporter.warn('returning logName');
            return v.reporter.reporterName;
        }).returns(equaling(t.reporter.reporterName));
    });
});