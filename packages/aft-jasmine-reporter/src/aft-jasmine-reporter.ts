import jasmine = require("jasmine");
import { FileSystemMap } from "aft-core";
import { AftTest } from "./aft-test";

export class AftJasmineReporter implements jasmine.CustomReporter {
    private readonly _async2Sync: Array<Promise<any>>;
    private readonly _testNames: FileSystemMap<string, any>;

    constructor() {
        this._async2Sync = new Array<Promise<void>>; // eslint-disable-line
        this._testNames = new FileSystemMap<string, any>(this.constructor.name);
    }
    
    jasmineStarted(): void {
        AftTest.clearCache();
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
        const t: AftTest = new AftTest({test: result});
        this._testNames.set(t.fullName, true);
    }
    specDone(result: jasmine.SpecResult): void {
        this._async2Sync.push(this._asyncSpecDone(result));
    }

    private async _asyncSpecDone(result: jasmine.SpecResult): Promise<void> {
        const t = new AftTest({test: result});
        if (t.getCachedResults(t.fullName).length === 0) {
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
            await t.dispose();
        }
        this._testNames.delete(t.fullName);
    }
}

module.exports = AftJasmineReporter; // eslint-disable-line no-undef