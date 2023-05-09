import { IPolicyEnginePlugin, AftConfig, aftConfig, ProcessingResult } from "../../../src";

export class MockPolicyEnginePluginConfig {
    enabled: boolean = false;
    expectedResults: Map<string, ProcessingResult<boolean>> = new Map<string, ProcessingResult<boolean>>();
}

export class MockPolicyEnginePlugin implements IPolicyEnginePlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "policy-engine" = 'policy-engine';
    public readonly enabled: boolean;
    private readonly _tests: Map<string, ProcessingResult<boolean>>;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockPolicyEnginePluginConfig);
        this.enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._tests = cfg.expectedResults ?? new Map<string, ProcessingResult<boolean>>();
        }
    }
    async shouldRun(testId: string): Promise<ProcessingResult<boolean>> {
        if (this.enabled) {
            return this._tests.get(testId) ?? {result: false, message: `${testId} is not in known set of tests`};
        }
        return {result: true};
    }
}