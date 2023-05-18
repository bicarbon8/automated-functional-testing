import { test, jest } from "@jest/globals";
import { Verifier, equaling } from "aft-core";
import { AftTest } from "../src";
import { AftLog } from "../src/aft-log";

describe('AftJestReporter', () => {
    test('can create an AftLog instance', async () => {
        const t = new AftLog();
        await t.reporter.info('starting AftJestReporter test...');
        expect(t.test).toBeDefined();
        expect(t.fullName).toEqual('AftJestReporter can create an AftLog instance');
        await t.reporter.info('completed AftJestReporter test.');
    });

    test('can check if test should be run [C1234]', async () => {
        const t = new AftTest();
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            test.skip('...', () => null);
        }

        expect(t.fullName).toEqual('AftJestReporter can check if test should be run [C1234]');
    });

    test('can skip test [C4567] if should not be run', async () => {
        const t = new AftTest();
        jest.spyOn(t, 'shouldRun').mockReturnValue(Promise.resolve(false));
        const shouldRun: boolean = await t.shouldRun();
        if (!shouldRun) {
            test.skip('...', () => null);
        }

        expect(true).toBeFalse();
    });

    test('provides a Verifier instance for use in test control', async () => {
        const t = new AftTest();
        await t.verify(async (v: Verifier) => {
            await v.reporter.warn('returning logName');
            return v.reporter.reporterName;
        }).returns(equaling(t.reporter.reporterName));
    });
});