import { Verifier, equaling } from "aft-core";
import { AftTest } from "../src";

describe('AftJasmineReporter', () => {
    it('can create an AftTest instance', async () => {
        const t = new AftTest();
        await t.reporter.info('starting AftJasmineReporter test...');
        expect(t.test).toBeDefined();
        expect(t.fullName).toEqual('AftJasmineReporter can create an AftTest instance');
        await t.reporter.info('completed AftJasmineReporter test.');
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
            await v.reporter.warn('returning logName');
            return v.reporter.reporterName;
        }).returns(equaling(t.reporter.reporterName));
    });
});