import { LogManager } from "aft-core";
import { IncomingHttpHeaders, OutgoingHttpHeaders } from "http";

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'UPDATE' | 'DELETE';

/**
 * to be used with the `httpService.performRequest` function
 * like follows:
 * ```typescript
 * await httpService.performRequest({url: 'https://some.domain/path'});
 * ```
 * or fully as:
 * ```typescript
 * await httpService.performRequest({
 *     url: 'https://some.domain/path',
 *     allowAutoRedirect: false,
 *     headers: {"Authorization": "basic AS0978FASLKLJA/=="},
 *     method: 'POST',
 *     postData: someObject,
 *     multipart: false
 * });
 * ```
 */
export type HttpRequest = {
    url?: string;
    allowAutoRedirect?: boolean;
    headers?: OutgoingHttpHeaders;
    method?: HttpMethod;
    postData?: any;
    multipart?: boolean;
    logMgr?: LogManager;
};

/**
 * a wrapper used to hold the response details from a
 * call to `httpService.performRequest(...)` including the
 * response `headers`, `data` and `statusCode`
 */
export type HttpResponse = {
    headers?: IncomingHttpHeaders;
    data?: string;
    statusCode?: number;
};