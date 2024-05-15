import { ProcessingResult, containing, AftConfig, retry, Retry } from "aft-core";
import { AftJasmineTest, aftJasmineTest } from "../src";

describe('AftJasmineReporter', () => {
    it('can create an AftJasmineTest instance', async () => {
        const t = new AftJasmineTest();
        await t.reporter.info('starting AftJasmineReporter test...');
        expect(t.test).not.toBeDefined(); // only defined within the Jasmine Reporter
        expect(t.description).toEqual('AftJasmineReporter can create an AftJasmineTest instance');
        await t.reporter.info('completed AftJasmineReporter test.');
    });

    it('can check if test should be run [C1234] when not inside AftJasmineTest', async () => {
        const t = new AftJasmineTest(null, null, {aftCfg: new AftConfig({plugins: []})});
        const shouldRun = await t.shouldRun();
        if (shouldRun.result !== true) {
            pending(shouldRun.message);
        }

        expect(t.description).toEqual('AftJasmineReporter can check if test should be run [C1234] when not inside AftJasmineTest');
    });

    it('can skip test [C4567] if should not be run when not inside AftJasmineTest', async () => {
        const t = new AftJasmineTest();
        spyOn(t, 'shouldRun').and.returnValue(Promise.resolve<ProcessingResult<boolean>>({result: false, message: 'fake'}));
        const shouldRun = await t.shouldRun();
        if (shouldRun.result !== true) {
            pending(shouldRun.message);
        }

        expect(true).toBeFalse(); // force failure if skip does not happen
    });

    it('[C6543] provides a AftJasmineTest instance for use in test control', async () => {
        await aftJasmineTest(async (v: AftJasmineTest) => {
            await v.verify(v.description, 'AftJasmineReporter [C6543] provides a AftJasmineTest instance for use in test control');
            await v.verify(v.testIds, containing('C6543'), 'expected to parse test ID from description');
        });
    });

    it('[C9999] allows retry to be wrapped around the aftJasmineTest', async () => {
        let index = 0;
        await retry((r: Retry<AftJasmineTest>) => aftJasmineTest(async (t: AftJasmineTest) => {
            await t.verify(index++, 2, '[C9999]');
        }, {
            additionalMetadata: {
                attempt: r.totalAttempts
            }
        }), {
            delay: 10,
            backOffType: 'linear',
            maxDuration: 5000
        }).until((t: AftJasmineTest) => t.status === 'passed');
    }, 6000);
});
