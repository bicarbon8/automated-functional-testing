import { AftConfig, Plugin, PluginConfig } from "../../src";

export class MockPluginConfig extends PluginConfig {}

export class MockPlugin extends Plugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    public readonly implements: string = 'mock';
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockPluginConfig);
        this._enabled = cfg.enabled;
    }
}