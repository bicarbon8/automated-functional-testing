import { ProcessingResult, AftTest, containing } from "aft-core";
import { AftJasmineTest, aftJasmineTest } from "../src";

describe('AftJasmineReporter', () => {
    it('can create an AftJasmineTest instance', async () => {
        const t = new AftJasmineTest();
        await t.reporter.info('starting AftJasmineReporter test...');
        expect(t.test).not.toBeDefined(); // only defined within the Jasmine Reporter
        expect(t.description).toEqual('AftJasmineReporter can create an AftJasmineTest instance');
        await t.reporter.info('completed AftJasmineReporter test.');
    });

    it('can check if test should be run [C1234]', async () => {
        const t = new AftJasmineTest();
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) {
            await t.pending(shouldRun.message);
        }

        expect(t.description).toEqual('AftJasmineReporter can check if test should be run [C1234]');
    });

    it('can skip test [C4567] if should not be run', async () => {
        const t = new AftJasmineTest();
        spyOn(t, 'shouldRun').and.returnValue(Promise.resolve<ProcessingResult<boolean>>({result: false, message: 'fake'}));
        const shouldRun = await t.shouldRun();
        if (!shouldRun.result) {
            await t.pending(shouldRun.message);
        }

        expect(true).toBeFalse(); // force failure if skip does not happen
    });

    it('[C1234] provides a AftJasmineTest instance for use in test control', async () => {
        await aftJasmineTest(async (v: AftJasmineTest) => {
            await v.verify(v.description, 'AftJasmineReporter [C1234] provides a AftJasmineTest instance for use in test control');
            await v.verify(v.testIds, containing('C1234'), 'expected to parse test ID from description');
        });
    });
});
