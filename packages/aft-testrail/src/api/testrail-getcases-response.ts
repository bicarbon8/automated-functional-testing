import { ICanHaveError } from "./ican-have-error";
import { TestRailCase } from "./testrail-case";
import { TestRailPagedResponseLinks } from "./testrail-paged-response-links";

export interface TestRailGetCasesResponse extends ICanHaveError {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    cases: TestRailCase[];
}