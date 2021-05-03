import { TestRailPlanEntry } from "./testrail-plan-entry";

export interface TestRailPlan {
    blocked_count?: number;
    created_on?: number;
    description?: string;
    entries?: TestRailPlanEntry[];
    failed_count?: number;
    id?: number;
    name?: string;
    passed_count?: number;
    project_id?: number;
    retest_count?: number;
    untested_count?: number;
    url?: string;
}