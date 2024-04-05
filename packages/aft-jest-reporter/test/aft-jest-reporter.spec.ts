import { test, jest, expect } from "@jest/globals";
import { ProcessingResult, Verifier, equaling } from "aft-core";
import { AftJestTest } from "../src";

describe('AftJestReporter', () => {
    test('can create an AftJestTest instance', async () => {
        const aft = new AftJestTest(expect);
        await aft.reporter.info('starting AftJestReporter test...');
        expect(aft.test).not.toBeDefined(); // only defined inside the Jest Reporter
        expect(aft.fullName).toEqual('AftJestReporter can create an AftJestTest instance');
        await aft.reporter.info('completed AftJestReporter test.');
    });

    test('can check if test should be run [C1234]', async () => {
        const t = new AftJestTest(expect);
        await t.verify((v: Verifier) => t.fullName)
            .returns('AftJestReporter can check if test should be run [C1234]');
    });

    test('can skip test [C4567] if should not be run', async () => {
        const t = new AftJestTest(expect);
        jest.spyOn(t, 'shouldRun').mockImplementation(() => Promise.resolve({result: false, message: 'fake'}));
        const shouldRun: ProcessingResult<boolean> = await t.shouldRun();
        if (!shouldRun.result) {
            await t.pending(shouldRun.message);
            return; // Jest doesn't support programmic skip https://github.com/jestjs/jest/issues/7245
        }

        expect(true).toBe(false);
    });

    test('provides a Verifier instance for use in test control', async () => {
        const t = new AftJestTest(expect);
        await t.verify(async (v: Verifier) => {
            await v.reporter.warn('returning logName');
            return v.reporter.loggerName;
        }).returns(equaling(t.reporter.loggerName));
    });
});