import { DefectStatus, Defect, IDefectPlugin, rand, AftConfig, aftConfig } from "../../../src";

export class MockDefectPluginConfig {
    enabled: boolean = false;
    defects: Array<Defect> = new Array<Defect>();
}

export class MockDefectPlugin implements IDefectPlugin {
    public readonly aftCfg: AftConfig;
    public readonly pluginType: "defect" = 'defect';
    public readonly enabled: boolean;
    private readonly _defects: Array<Defect>;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        const cfg = this.aftCfg.getSection(MockDefectPluginConfig);
        this.enabled = cfg.enabled ?? false;
        if (this.enabled) {
            this._defects = cfg.defects ?? new Array<Defect>();
        }
    }
    async getDefect(defectId: string): Promise<Defect> {
        if (this.enabled) {
            return this._defects.find(d => d.id === defectId);
        }
        return null;
    }
    async findDefects(searchCriteria: Partial<Defect>): Promise<Defect[]> {
        if (this.enabled) {
            let found = [...this._defects];
            if (searchCriteria.id) {
                found = found.filter(d => d.id === searchCriteria.id);
            }
            if (searchCriteria.title) {
                found = found.filter(d => d.title?.includes(searchCriteria.title));
            }
            if (searchCriteria.status) {
                found = found.filter(d => d.status === searchCriteria.status);
            }
            if (searchCriteria.description) {
                found = found.filter(d => d.description?.includes(searchCriteria.description));
            }
            return found;
        }
        return new Array<Defect>();
    }
}