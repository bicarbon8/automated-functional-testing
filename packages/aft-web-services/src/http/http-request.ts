import { LoggingPluginManager } from "aft-core";
import { OutgoingHttpHeaders } from "http";
import { HttpMethod } from "./http-method";

/**
 * to be used with the `httpService.performRequest` function
 * like follows:
 * ```
 * await httpService.performRequest({url: 'https://some.domain/path'});
 * ```
 * or fully as:
 * ```
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
export interface HttpRequest {
    url?: string;
    allowAutoRedirect?: boolean;
    headers?: OutgoingHttpHeaders;
    method?: HttpMethod;
    postData?: any;
    multipart?: boolean;
    logMgr?: LoggingPluginManager;
}