import { IncomingHttpHeaders } from "http";

export interface HttpResponseOptions {
    headers?: IncomingHttpHeaders;
    data?: string;
    statusCode?: number;
}