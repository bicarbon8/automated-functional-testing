import jasmine = require("jasmine");
import { Err, FileSystemMap, ProcessingResult } from "aft-core";
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
        FileSystemMap.removeMapFile(CurrentlyExecutingTestMap);
        FileSystemMap.removeMapFile(AftJasmineTest.name);
        afterEach(async () => { // eslint-disable-line no-undef
            await this._processPromises();
        });
    }
    async specStarted(result: jasmine.SpecResult): Promise<void> {
        const t = new AftJasmineTest(result, null, {_preventCacheClear: true});
        /**
         * #### NOTE:
         * > Jasmine does not allow a Reporter to force bail-out of test
         * at this point so we cannot mark test as pending and prevent
         * execution from here and instead must use `AftJasmineTest.shouldRun`
         * in the beginning of the test
         */
        this._testNames.set(t.description, true);
    }
    specDone(result: jasmine.SpecResult): void {
        const t = new AftJasmineTest(result, null, {_preventCacheClear: true});
        if (t.results.length === 0) {
            let logPromise: Promise<ProcessingResult<void> | void>;
            // no results logged for this test yet so we should log it
            switch (result?.status) {
                case 'passed':
                    logPromise = Err.handleAsync(() => t.pass(), {errLevel: 'none'});
                    break;
                case 'failed':
                    let err: string;
                    if (result?.failedExpectations?.length) {
                        err = result.failedExpectations.map(e => `${e.message}\n${e.stack}`).join('\n');
                    }
                    logPromise = Err.handleAsync(() => t.fail(err), {errLevel: 'none'});
                    break;
                case 'excluded':
                case 'pending':
                    logPromise = Err.handleAsync(() => t.pending(result.pendingReason ?? 'test skipped'), {errLevel: 'none'});
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
