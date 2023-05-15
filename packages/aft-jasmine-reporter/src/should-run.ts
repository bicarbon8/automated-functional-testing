import { aftConfig, AftConfig, PolicyEngineManager, ProcessingResult } from "aft-core";

export class ShouldRun {
    public readonly aftCfg: AftConfig;

    private _testMgr: PolicyEngineManager;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
    }

    get policyEngMgr(): PolicyEngineManager {
        if (!this._testMgr) {
            this._testMgr = new PolicyEngineManager(this.aftCfg);
        }
        return this._testMgr;
    }

    async tests(...tests: string[]): Promise<ProcessingResult<boolean>> {
        const shouldRunTests = new Array<string>();
        const shouldNotRunTests = new Array<string>();
        if (tests?.length) {
            for (var i=0; i<tests.length; i++) {
                const testId: string = tests[i];
                const result = await this.policyEngMgr.shouldRun(testId);
                if (result.result === true) {
                    shouldRunTests.push(testId);
                } else {
                    shouldNotRunTests.push(testId);
                }
            }
            const shouldRun: boolean = shouldRunTests.length > 0;
            if (!shouldRun) {
                return {result: false, message: `none of the supplied tests should be run: [${tests.join(', ')}]`};
            }
        }
        return {result: true, message: `returning the test IDs, as an array, that should be run: [${shouldRunTests.join(', ')}]`};
    }
}

export const shouldRun = new ShouldRun();