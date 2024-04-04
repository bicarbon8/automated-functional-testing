import { AftConfig, ExpiringFileLock, FileSystemMap, aftConfig } from "aft-core";
import { TestRailApi } from "../api/testrail-api";
import { TestRailConfig } from "../configuration/testrail-config";
import { TestRailPlan } from "../api/testrail-custom-types";

export class PlanId {
    /**
     * looks for an existing TestRail plan id
     * @param aftCfg an instance of {AftConfig}
     * @param api an instance of {TestRailApi}
     * @returns either an existing TestRail plan id or a newly created plan id
     */
    static async get(aftCfg?: AftConfig, api?: TestRailApi): Promise<number> {
        aftCfg ??= aftConfig;
        api ??= new TestRailApi(aftCfg);
        const trc = aftCfg.getSection(TestRailConfig);
        let planId: number = trc.planId;
        if (planId == null || planId <= 0) {
            const key = TestRailConfig.name;
            const lock: ExpiringFileLock = new ExpiringFileLock(key, aftCfg);
            try {
                const fsm = new FileSystemMap<string, number>(key, [], aftCfg);
                planId = fsm.get('planId');
                if (planId == null || planId <= 0) {
                    // create new Test Plan if one doesn't already exist
                    const projectId: number = trc.projectId;
                    const suiteIds: number[] = trc.suiteIds;
                    const plan: TestRailPlan = await api.createPlan(projectId, suiteIds);
                    trc.planId = plan.id; 
                    fsm.set('planId', trc.planId); // sets value in FileSystemMap for key 'planId'
                }
            } finally {
                lock.unlock();
            }
        }
        return planId;
    }
}
