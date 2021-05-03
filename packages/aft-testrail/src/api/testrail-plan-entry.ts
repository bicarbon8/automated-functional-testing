import { TestRailRun } from "./testrail-run";

export interface TestRailPlanEntry {
    id?: string;
    name?: string;
    runs?: TestRailRun[];
    suite_id?: number;
    include_all?: boolean;
    config_ids?: number[];
}