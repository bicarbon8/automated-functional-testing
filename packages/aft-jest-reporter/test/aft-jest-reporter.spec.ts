import { test, jest, expect } from "@jest/globals";
import { Verifier, equaling } from "aft-core";
import { AftJestTest } from "../src";

describe('AftJestReporter', () => {
    test('can create an AftJestTest instance', async () => {
        const aft = new AftJestTest(expect);
        await aft.reporter.info('starting AftJestReporter test...');
        expect(aft.test).toBeDefined();
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
        jest.spyOn(t, 'shouldRun').mockImplementation(() => Promise.resolve(false));
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            t.skipped();
            return; // jest refuses to provide programmatic skip / pending capabilities
        }

        expect(true).toBe(false);
    });

    test('provides a Verifier instance for use in test control', async () => {
        const t = new AftJestTest(expect);
        await t.verify(async (v: Verifier) => {
            await v.reporter.warn('returning logName');
            return v.reporter.reporterName;
        }).returns(equaling(t.reporter.reporterName));
    });
});