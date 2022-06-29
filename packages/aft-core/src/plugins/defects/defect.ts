import { DefectStatus } from "./defect-status";

export type Defect = {
    id: string;
    title?: string;
    description?: string;
    status: DefectStatus;
};