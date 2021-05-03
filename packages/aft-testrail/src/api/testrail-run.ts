export interface TestRailRun {
    blocked_count?: number;
    config?: string;
    config_ids?: number[];
    created_on?: number;
    description?: string;
    failed_count?: number;
    id?: number;
    name?: string;
    passed_count?: number;
    plan_id?: number;
    project_id?: number;
    retest_count?: number;
    suite_id?: number;
    untested_count?: number;
    url?: string;
}