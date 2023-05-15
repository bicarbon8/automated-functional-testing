import { AftConfig, ResultsPlugin, TestResult } from "../../../src";

export class MockResultsPluginConfig {
    enabled: boolean = false;
}

export class MockResultsPlugin extends ResultsPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }

    public readonly results: Array<TestResult>;

    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockResultsPluginConfig);
        this._enabled = cfg.enabled;
        if (this.enabled) {
            this.results = new Array<TestResult>();
        }
    }

    override submitResult = async (result: TestResult): Promise<void> => {
        if (this.enabled) {
            this.results.push(result);
        }
    }
}