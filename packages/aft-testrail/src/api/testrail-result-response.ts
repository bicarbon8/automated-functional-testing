import { ICanHaveError } from "./ican-have-error";

export interface TestRailResultResponse extends ICanHaveError {
    comment?: string;
    created_on?: number;
    defects?: string;
    elapsed?: string;
    id?: number;
    status_id?: number;
    test_id?: number;
    version?: string;
}