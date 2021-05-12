import { OutgoingHttpHeaders } from "http";
import { HttpMethod } from "./http-method";

/**
 * to be used with the `HttpService.instance.performRequest` function
 * like follows:
 * ```
 * await HttpService.instance.performRequest({url: 'https://some.domain/path'});
 * ```
 * or fully as:
 * ```
 * await HttpService.instance.performRequest({
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
}