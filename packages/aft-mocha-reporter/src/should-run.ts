import { Defect, DefectManager, defects, IHasOptions, ProcessingResult, TestCaseManager, testcases } from "aft-core";

export type ShouldRunOptions = {
    testMgr?: TestCaseManager;
    defectMgr?: DefectManager;
}

export class ShouldRun implements IHasOptions<ShouldRunOptions> {
    private readonly _options: ShouldRunOptions;

    private _testMgr: TestCaseManager;
    private _defectMgr: DefectManager;

    constructor(options?: ShouldRunOptions) {
        this._options = options || {};
    }

    option<K extends keyof ShouldRunOptions, V extends ShouldRunOptions[K]>(key: K, defaultVal?: V): V {
        const result: V = this._options[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    get testMgr(): TestCaseManager {
        if (!this._testMgr) {
            this._testMgr = this.option('testMgr', testcases);
        }
        return this._testMgr;
    }

    get defectMgr(): DefectManager {
        if (!this._defectMgr) {
            this._defectMgr = this.option('defectMgr', defects);
        }
        return this._defectMgr;
    }

    async tests(...tests: string[]): Promise<ProcessingResult> {
        const shouldRunTests = new Array<string>();
        const shouldNotRunTests = new Array<string>();
        if (tests?.length) {
            for (var i=0; i<tests.length; i++) {
                let testId: string = tests[i];
                let result: boolean = await this.testMgr.shouldRun(testId);
                if (result === true) {
                    let defects: Array<Defect> = await this.defectMgr.findDefects(testId) || new Array<Defect>();
                    if (defects.some((d: Defect) => d?.status == 'open')) {
                        let openDefects: string = defects
                            .filter((d: Defect) => d.status == 'open')
                            .map((d: Defect) => d.id)
                            .join(', ');
                        shouldNotRunTests.push(testId);
                        return {
                            success: false, 
                            message: `the testId ${testId} has one or more open defects so test should not be run: [${openDefects}]`
                        };
                    } else {
                        shouldRunTests.push(testId);
                    }
                } else {
                    shouldNotRunTests.push(testId);
                }
            }
            let shouldRun: boolean = shouldRunTests.length > 0;
            if (!shouldRun) {
                return {success: false, message: `none of the supplied tests should be run: [${tests.join(', ')}]`};
            }
        }
        return {success: true, message: 'returning the test IDs, as an array, that should be run', obj: shouldRunTests};
    }

    async defects(...defects: string[]): Promise<ProcessingResult> {
        // first search for any specified Defects by ID
        if (defects?.length) {
            for (var i=0; i<defects.length; i++) {
                let defectId: string = defects[i];
                let defect: Defect = await this.defectMgr.getDefect(defectId);
                if (defect?.status == 'open') {
                    return {success: false, message: `Defect: '${defectId}' is open so test should not be run.`};
                }
            }
        }
        return {success: true};
    }
}

export const shouldRun = new ShouldRun();