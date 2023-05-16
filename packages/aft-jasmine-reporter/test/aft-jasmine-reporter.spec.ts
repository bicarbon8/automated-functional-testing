import { Verifier, equaling } from "aft-core";
import { AftTest } from "../src";
import { AftLog } from "../src/aft-log";

describe('AftJasmineReporter', () => {
    it('can create an AftLog instance', async () => {
        const t = new AftLog();
        await t.logMgr.info('starting AftJasmineReporter test...');
        expect(t.test).toBeDefined();
        expect(t.fullName).toEqual('AftJasmineReporter can create an AftLog instance');
        await t.logMgr.info('completed AftJasmineReporter test.');
    });

    it('can check if test should be run [C1234]', async () => {
        const t = new AftTest();
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            pending();
        }

        expect(t.fullName).toEqual('AftJasmineReporter can check if test should be run [C1234]');
    });

    it('can skip test [C4567] if should not be run', async () => {
        const t = new AftTest();
        spyOn(t, 'shouldRun').and.returnValue(Promise.resolve(false));
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            pending();
        }

        expect(true).toBeFalse();
    });

    it('provides a Verifier instance for use in test control', async () => {
        const t = new AftTest(this);
        await t.verify(async (v: Verifier) => {
            await v.logMgr.warn('returning logName');
            return v.logMgr.logName;
        }).returns(equaling(t.logMgr.logName));
    });
});