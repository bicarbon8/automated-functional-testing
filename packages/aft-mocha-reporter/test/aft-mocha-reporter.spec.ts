import { expect } from "chai";
import { AftLog, AftTest } from "../src";
import * as sinon from "sinon";
import { Verifier, equaling } from "aft-core";

describe('AftMochaReporter', () => {
    it('passes a Mocha Test to the test that can be used by AftLog', async function () {
        this.timeout(10000);
        const t = new AftTest(this);
        const shouldRun = await t.shouldRun();
        if (!shouldRun) { 
            t.test.skip();
        }
        expect(t).to.exist;
        expect(t.logMgr).to.exist;
        expect(t.logMgr.logName).to.equal(t.fullTitle);

        await t.logMgr.trace('sample log message');
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
        const t = new AftLog(this);
        
        expect(t).to.exist;
        expect(t.logMgr).to.exist;
        expect(t.logMgr.logName).to.eql('AFT');
        
        // NOTE: arrow functions have no `this` so `this.test.fullTitle` doesn't exist
        // expect(t.logMgr.logName).to.equal(t.fullTitle);

        await t.logMgr.trace('sample log message from aft-mocha-reporter.spec with arrow function');
    });

    it('provides a Verifier instance for use in test control', async function() {
        this.timeout(10000);
        const t = new AftTest(this);
        await t.verify(async (v: Verifier) => {
            await v.logMgr.warn('returning logName');
            return v.logMgr.logName;
        }).returns(equaling(t.logMgr.logName));
    });
});