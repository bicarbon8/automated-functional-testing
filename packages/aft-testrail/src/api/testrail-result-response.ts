import { ICanHaveError } from "./ican-have-error";
import { TestRailPagedResponseLinks } from "./testrail-paged-response-links";
import { TestRailResult } from "./testrail-result";

export interface TestRailResultResponse extends ICanHaveError {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    results: TestRailResult[];
}