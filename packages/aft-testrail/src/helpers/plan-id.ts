import { AftConfig, ExpiringFileLock, aftConfig, fileio } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailConfig } from "../configuration/testrail-config";
import { TestRailPlan } from "../api/testrail-custom-types";

export module PlanId {
    export async function get(aftCfg?: AftConfig, api?: TestRailApi): Promise<number> {
        let planId: number;
        aftCfg ??= aftConfig;
        api ??= new TestRailApi(aftCfg);
        const trc = aftCfg.getSection(TestRailConfig);
        const key = `${this.constructor.name}-p${trc.projectId}-s${trc.suiteIds.join('_')}`;
        const lock: ExpiringFileLock = fileio.getExpiringFileLock(key, this._aftCfg);
        try {
            // create new Test Plan if one doesn't already exist
            planId = (this._fsm.get('planId') as number) ?? trc.planId;
            if (planId <= 0) {
                let projectId: number = trc.projectId;
                let suiteIds: number[] = trc.suiteIds;
                let plan: TestRailPlan = await this._api.createPlan(projectId, suiteIds);
                trc.planId = plan.id; 
                this._fsm.set('planId', trc.planId); // sets value in FileSystemMap for key 'planId'
            }
        } finally {
            lock.unlock();
        }
        return planId;
    }
}