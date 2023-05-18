import { TestExecutionPolicyPlugin, AftConfig, ProcessingResult } from "../../../src";

export class MockTestExecutionPolicyPluginConfig {
    enabled: boolean = false;
    expectedResults: Map<string, ProcessingResult<boolean>> = new Map<string, ProcessingResult<boolean>>();
}

export class MockTestExecutionPolicyPlugin extends TestExecutionPolicyPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    private readonly _tests: Map<string, ProcessingResult<boolean>>;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockTestExecutionPolicyPluginConfig);
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