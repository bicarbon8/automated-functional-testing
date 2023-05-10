import { AftConfig, BuildInfoPlugin, rand } from "../../../src";

export class MockBuildInfoPluginConfig {
    buildName: string;
    buildNumberMin: number;
    buildNumberMax: number;
    enabled: boolean;
};

export class MockBuildInfoPlugin extends BuildInfoPlugin {
    public override readonly enabled: boolean;
    private readonly _buildName: string;
    private readonly _buildNumberMin: number;
    private readonly _buildNumberMax: number;
    constructor(aftCfg?: AftConfig) {
        super(aftCfg);
        const cfg = this.aftCfg.getSection(MockBuildInfoPluginConfig);
        this.enabled = cfg.enabled ?? false;
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