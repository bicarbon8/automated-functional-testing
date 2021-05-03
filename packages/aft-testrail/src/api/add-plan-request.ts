import { TestRailPlanEntry } from "./testrail-plan-entry";

export interface AddPlanRequest {
    name?: string;
    entries?: TestRailPlanEntry[];
}