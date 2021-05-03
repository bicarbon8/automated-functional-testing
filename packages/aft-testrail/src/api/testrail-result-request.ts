export interface TestRailResultRequest {
    status_id?: number;
    comment?: string;
    version?: string;
    elapsed?: string;
    defects?: string; // comma delimited list
}