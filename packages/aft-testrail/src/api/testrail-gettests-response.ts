import { ICanHaveError } from "./ican-have-error";
import { TestRailPagedResponseLinks } from "./testrail-paged-response-links";
import { TestRailTest } from "./testrail-test";

export interface TestRailGetTestsResponse extends ICanHaveError {
    offset: number;
    limit: number;
    size: number;
    _links: TestRailPagedResponseLinks;
    tests: TestRailTest[];
}