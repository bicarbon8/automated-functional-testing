import { Verifier, equaling } from "aft-core";
import { AftJasmineTest } from "../src";

describe('AftJasmineReporter', () => {
    it('can create an AftJasmineTest instance', async () => {
        const t = new AftJasmineTest();
        await t.reporter.info('starting AftJasmineReporter test...');
        expect(t.test).toBeDefined();
        expect(t.fullName).toEqual('AftJasmineReporter can create an AftJasmineTest instance');
        await t.reporter.info('completed AftJasmineReporter test.');
    });

    it('can check if test should be run [C1234]', async () => {
        const t = new AftJasmineTest();
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            pending();
        }

        expect(t.fullName).toEqual('AftJasmineReporter can check if test should be run [C1234]');
    });

    it('can skip test [C4567] if should not be run', async () => {
        const t = new AftJasmineTest();
        spyOn(t, 'shouldRun').and.returnValue(Promise.resolve(false));
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            pending();
        }

        expect(true).toBeFalse();
    });

    it('provides a Verifier instance for use in test control', async () => {
        const t = new AftJasmineTest(this);
        await t.verify(async (v: Verifier) => {
            await v.reporter.warn('returning logName');
            return v.reporter.reporterName;
        }).returns(equaling(t.reporter.reporterName));
    });
});