import { OutgoingHttpHeaders } from "http";

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
 *     method: HttpMethod.POST,
 *     postData: JSON.stringify(someObject) 
 * });
 * ```
 */
export interface HttpRequest {
    url?: string;
    allowAutoRedirect?: boolean;
    headers?: OutgoingHttpHeaders;
    method?: string;
    postData?: string;
}