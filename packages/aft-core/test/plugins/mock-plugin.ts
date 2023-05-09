import { AftConfig, IPlugin, aftConfig } from "../../src";

export class MockPluginConfig {
    enabled: boolean = false;
}

export class MockPlugin implements IPlugin {
    public readonly aftCfg: AftConfig;
    public readonly enabled: boolean;
    public readonly pluginType: string = 'mock';
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockPluginConfig);
        this.enabled = cfg.enabled;
    }
}