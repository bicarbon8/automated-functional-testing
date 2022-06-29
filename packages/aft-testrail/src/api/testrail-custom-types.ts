import { Merge } from "aft-core";

export type ICanHaveError = {
    error?: string;
};

export type TestRailCase = {
    created_by?: number;
    created_on?: number;
    id?: number;
    priority_id?: number;
    suite_id?: number;
    title?: string;
    type_id?: number;
};

export type TestRailTest = {
    case_id?: number;
    id?: number;
    priority_id?: number;
    run_id?: number;
    status_id?: number;
    title?: string;
    type_id?: number;
};

export type TestRailRun = {
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
};

export type TestRailPagedResponseLinks = {
    next: string;
    prev: string;
}

export type TestRailGetCasesResponse = Merge<ICanHaveError, {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    cases: TestRailCase[];
}>;

export type TestRailGetTestsResponse = Merge<ICanHaveError, {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    tests: TestRailTest[];
}>;

export type TestRailPlanEntry = {
    id?: string;
    name?: string;
    runs?: TestRailRun[];
    suite_id?: number;
    include_all?: boolean;
    config_ids?: number[];
};

export type AddPlanRequest = {
    name?: string;
    entries?: TestRailPlanEntry[];
};

export type TestRailPlan = {
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
};

export type TestRailResult = {
    comment?: string;
    created_on?: number;
    defects?: string;
    elapsed?: string;
    id?: number;
    status_id?: number;
    test_id?: number;
    version?: string;
};

export type TestRailResultRequest = {
    status_id?: number;
    comment?: string;
    version?: string;
    elapsed?: string;
    defects?: string; // comma delimited list
};

export type TestRailResultResponse = Merge<ICanHaveError, {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    results: TestRailResult[];
}>;