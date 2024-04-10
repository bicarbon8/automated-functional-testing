import jasmine = require("jasmine");
import { FileSystemMap } from "aft-core";
import { AftJasmineTest } from "./aft-jasmine-test";
import { CurrentlyExecutingTestMap } from "./aft-jasmine-constants";

export class AftJasmineReporter implements jasmine.CustomReporter {
    private readonly _promisesArray: Array<Promise<any>>;
    private readonly _testNames: FileSystemMap<string, any>;
    constructor() {
        this._promisesArray = new Array<Promise<void>>(); // eslint-disable-line
        this._testNames = new FileSystemMap<string, boolean>(CurrentlyExecutingTestMap);
    }
    jasmineStarted(): void {
        FileSystemMap.removeCacheFile(CurrentlyExecutingTestMap);
        FileSystemMap.removeCacheFile(AftJasmineTest.name);
        afterEach(async () => { // eslint-disable-line no-undef
            await this._processPromises();
        });
    }
    async specStarted(result: jasmine.SpecResult): Promise<void> {
        const t = new AftJasmineTest(result);
        /**
         * NOTE: Jasmine does not allow a Reporter to force bail-out of test
         * at this point so we cannot mark test as pending and prevent
         * execution from here and instead must use `AftJasmineTest.shouldRun`
         * in the beginning of the test
         */
        this._testNames.set(t.description, true);
    }
    specDone(result: jasmine.SpecResult): void {
        const t = new AftJasmineTest(result);
        if (t.results.length === 0) {
            let logPromise: Promise<void>;
            // no results logged for this test yet so we should log it
            switch (result?.status) {
                case 'passed':
                    logPromise = t.pass();
                    break;
                case 'failed':
                    logPromise = t.fail();
                    break;
                case 'pending':
                    logPromise = t.pending();
                    break;
                default:
                    logPromise = t.reporter.warn(`unknown test.status of '${result.status}' returned`);
                    break;
            }
            this._promisesArray.push(logPromise);
        }
        this._testNames.delete(t.description);
    }
    jasmineDone(runDetails: jasmine.JasmineDoneInfo): void | Promise<void> { // eslint-disable-line no-unused-vars
        return this._processPromises();
    }
    private async _processPromises(): Promise<void> {
        while (this._promisesArray.length > 0) {
            try {
                const promise = this._promisesArray.shift();
                await promise;
            } catch (e) {
                console.log(e); // eslint-disable-line no-undef
            }
        }
    }
}

module.exports = AftJasmineReporter; // eslint-disable-line no-undef
