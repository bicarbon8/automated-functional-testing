import { AftConfig, IBuildInfoPlugin, aftConfig, rand } from "../../../src";

export class MockBuildInfoPluginConfig {
    buildName?: string;
    buildNumberMin?: number;
    buildNumberMax?: number;
    enabled?: boolean;
};

export class MockBuildInfoPlugin implements IBuildInfoPlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "build-info" = 'build-info';
    public readonly enabled: boolean;
    private readonly _buildName: string;
    private readonly _buildNumberMin: number;
    private readonly _buildNumberMax: number;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockBuildInfoPluginConfig);
        this.enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._buildName = cfg.buildName ?? rand.getString(4, false, true);
            this._buildNumberMin = cfg.buildNumberMin ?? 0;
            this._buildNumberMax = cfg.buildNumberMax ?? 9999;
        }
    }
    async buildName(): Promise<string> {
        if (this.enabled) {
            return `MockBuildName-${this._buildName}`;
        }
        return null;
    }
    async buildNumber(): Promise<string> {
        if (this.enabled) {
            return `MockBuildNumber-${rand.getInt(this._buildNumberMin, this._buildNumberMax)}`;
        }
        return null;
    }
}