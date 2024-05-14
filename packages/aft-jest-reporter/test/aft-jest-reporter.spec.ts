import { test, jest, expect } from "@jest/globals";
import { Err, ProcessingResult, containing } from "aft-core";
import { AftJestTest, aftJestTest } from "../src";

describe('AftJestReporter', () => {
    test('can create an AftJestTest instance', async () => {
        const aft = new AftJestTest(expect);
        await aft.reporter.info('starting AftJestReporter test...');
        expect(aft.test).not.toBeDefined(); // only defined inside the Jest Reporter
        expect(aft.description).toEqual('AftJestReporter can create an AftJestTest instance');
        await aft.reporter.info('completed AftJestReporter test.');
    });

    test('can check if test should be run [C1234]', async () => {
        const t = new AftJestTest(expect);
        const shouldRunSpy = jest.spyOn(t, 'shouldRun').mockImplementation(() => Promise.resolve({result: true, message: 'fake'}));
        const shouldRun: ProcessingResult<boolean> = await t.shouldRun();

        expect(shouldRun.result).toBeTruthy();
        expect(shouldRunSpy).toBeCalledTimes(1);
    });

    test('can skip test [C4567] if should not be run', async () => {
        const t = new AftJestTest(expect);
        jest.spyOn(t, 'shouldRun').mockImplementation(() => Promise.resolve({result: false, message: 'fake'}));
        const shouldRun: ProcessingResult<boolean> = await t.shouldRun();
        if (!shouldRun.result) {
            await Err.handleAsync(() => t.pending(shouldRun.message), {errLevel: 'none'});
            return; // Jest doesn't support programmic skip https://github.com/jestjs/jest/issues/7245
        }

        expect(true).toBe(false);
    });

    test('[C1234] provides a AftJestTest instance for use in test control', async () => {
        await aftJestTest(expect, async (v: AftJestTest) => {
            await v.verify(v.description, 'AftJestReporter [C1234] provides a AftJestTest instance for use in test control');
            await v.verify(v.testIds, containing('C1234'), 'expected to parse test ID from description');
        });
    });
});