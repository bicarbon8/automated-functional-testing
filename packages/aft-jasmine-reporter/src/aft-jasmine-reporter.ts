import jasmine = require("jasmine");
import { FileSystemMap } from "aft-core";
import { AftJasmineTest } from "./aft-jasmine-test";
import { CurrentlyExecutingTestMap } from "./aft-jasmine-constants";

export class AftJasmineReporter implements jasmine.CustomReporter {
    private readonly _async2Sync: Array<Promise<any>>;
    private readonly _testNames: FileSystemMap<string, any>;

    constructor() {
        this._async2Sync = new Array<Promise<void>>(); // eslint-disable-line
        this._testNames = new FileSystemMap<string, boolean>(CurrentlyExecutingTestMap);
    }
    
    jasmineStarted(): void {
        FileSystemMap.removeCacheFile(CurrentlyExecutingTestMap);
        FileSystemMap.removeCacheFile(AftJasmineTest.name);
        afterEach(async () => { // eslint-disable-line no-undef
            console.log('afterEach'); // eslint-disable-line no-undef
            while (this._async2Sync.length > 0) {
                try {
                    const promise = this._async2Sync.shift();
                    await promise;
                } catch (e) {
                    console.log(e); // eslint-disable-line no-undef
                }
            }
        });
    }
    
    async specStarted(result: jasmine.SpecResult): Promise<void> {
        console.log('specStarted');  // eslint-disable-line no-undef
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
        console.log('specDone');  // eslint-disable-line no-undef
        const t = new AftJasmineTest(result);
        if (t.results.length === 0) {
            switch (result?.status) {
                case 'passed':
                    this._async2Sync.push(t.pass());
                    break;
                case 'failed':
                    this._async2Sync.push(t.fail());
                    break;
                case 'pending':
                    this._async2Sync.push(t.pending());
                    break;
                default:
                    this._async2Sync.push(t.reporter.warn(`unknown test.status of '${result.status}' returned`));
                    break;
            }
        }
        this._testNames.delete(t.description);
    }
}

module.exports = AftJasmineReporter; // eslint-disable-line no-undef
