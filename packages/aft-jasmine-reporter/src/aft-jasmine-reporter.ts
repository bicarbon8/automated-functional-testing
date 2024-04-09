import jasmine = require("jasmine");
import { FileSystemMap } from "aft-core";
import { AftJasmineTest } from "./aft-jasmine-test";
import { CurrentlyExecutingTestMap } from "./aft-jasmine-constants";

export class AftJasmineReporter implements jasmine.CustomReporter {
    private readonly _async2Sync: Array<Promise<any>>;
    private readonly _testNames: FileSystemMap<string, any>;

    constructor() {
        this._async2Sync = new Array<Promise<void>>; // eslint-disable-line
        this._testNames = new FileSystemMap<string, any>(CurrentlyExecutingTestMap);
    }
    
    jasmineStarted(): void {
        FileSystemMap.removeCacheFile(CurrentlyExecutingTestMap);
        FileSystemMap.removeCacheFile(AftJasmineTest.name);
        beforeEach(async () => { // eslint-disable-line no-undef
            while (this._async2Sync.length > 0) {
                const asyncFunc = this._async2Sync.shift();
                await asyncFunc.catch((err) => {
                    console.error(err); // eslint-disable-line no-undef
                });
            }
        });
    }
    
    specStarted(result: jasmine.SpecResult): void {
        const t = new AftJasmineTest({test: result});
        /**
         * NOTE: Jasmine does not allow a Reporter to force bail-out of test
         * at this point so we cannot mark test as pending and prevent
         * execution from here and instead must use `AftJasmineTest.shouldRun`
         * in the beginning of the test
         */
        this._testNames.set(t.description, true);
    }
    specDone(result: jasmine.SpecResult): void {
        this._async2Sync.push(this._asyncSpecDone(result));
    }

    private async _asyncSpecDone(result: jasmine.SpecResult): Promise<void> {
        const t = new AftJasmineTest({test: result});
        if (t.results.length === 0) {
            switch (t.test.status) {
                case 'passed':
                    await t.pass();
                    break;
                case 'failed':
                    await t.fail();
                    break;
                case 'pending':
                    await t.pending();
                    break;
                default:
                    await t.reporter.warn(`unknown test.status of '${t.test.status}' returned`);
                    break;
            }
        }
        this._testNames.delete(t.description);
    }
}

module.exports = AftJasmineReporter; // eslint-disable-line no-undef
