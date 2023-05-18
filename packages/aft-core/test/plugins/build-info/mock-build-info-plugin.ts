import { AftConfig, BuildInfoPlugin, PluginConfig, rand } from "../../../src";

export class MockBuildInfoPluginConfig extends PluginConfig {
    buildName: string;
    buildNumberMin: number;
    buildNumberMax: number;
};

export class MockBuildInfoPlugin extends BuildInfoPlugin {
    private readonly _enabled: boolean;
    public override get enabled(): boolean {
        return this._enabled;
    }
    private readonly _buildName: string;
    private readonly _buildNumberMin: number;
    private readonly _buildNumberMax: number;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockBuildInfoPluginConfig);
        this._enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._buildName = cfg.buildName ?? rand.getString(4, false, true);
            this._buildNumberMin = cfg.buildNumberMin ?? 0;
            this._buildNumberMax = cfg.buildNumberMax ?? 9999;
        }
    }
    override buildName = async (): Promise<string> => {
        if (this.enabled) {
            return `MockBuildName-${this._buildName}`;
        }
        return null;
    }
    override buildNumber = async (): Promise<string> => {
        if (this.enabled) {
            return `MockBuildNumber-${rand.getInt(this._buildNumberMin, this._buildNumberMax)}`;
        }
        return null;
    }
}