import { PolicyPlugin, AftConfig, ProcessingResult } from "../../../src";

export class MockPolicyPluginConfig {
    enabled: boolean = false;
    expectedResults: Map<string, ProcessingResult<boolean>> = new Map<string, ProcessingResult<boolean>>();
}

export class MockPolicyPlugin extends PolicyPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    private readonly _tests: Map<string, ProcessingResult<boolean>>;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockPolicyPluginConfig);
        this._enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._tests = cfg.expectedResults ?? new Map<string, ProcessingResult<boolean>>();
        }
    }
    override shouldRun = async (testId: string): Promise<ProcessingResult<boolean>> => {
        if (this.enabled) {
            return this._tests.get(testId) ?? {result: false, message: `${testId} is not in known set of tests`};
        }
        return {result: true};
    }
}