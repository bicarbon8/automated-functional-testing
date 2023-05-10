import { AftConfig, Plugin, aftConfig } from "../../src";

export class MockPluginConfig {
    enabled: boolean = false;
}

export class MockPlugin extends Plugin {
    public override readonly enabled: boolean;
    public readonly implements: string = 'mock';
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockPluginConfig);
        this.enabled = cfg.enabled;
    }
}