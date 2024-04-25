import { convert } from "aft-core";

/**
 * a module containing helper const and functions to generate
 * HTTP headers that can then be appended to your header object using:
 * ```typescript
 * const headers = {
 *     ...HttpHeaders.Authorization.basic('myUsername', 'myPassword'),
 *     ...HttpHeaders.ContentType.get(HttpHeaders.MimeType.applicationJson)
 *     ...HttpHeaders.Cookies.setCookie({
 *         key: 'foo', 
 *         val: 'bar', 
 *         expiration: new Date().toString('u'), 
 *         secure: true, 
 *         httpOnly: true
 *     })
 * };
 * ```
 */
export namespace HttpHeaders {
    export namespace MimeType {
        export const applicationOctetstream = 'application/octet-stream';
        export const textPlain = 'text/plain';
        export const textCss = 'text/css';
        export const textHtml = 'text/html';
        export const textXml = 'text/xml';
        export const textJavascript = 'text/javascript';
        export const multipartFormData = 'multipart/form-data';
        export const applicationJson = 'application/json';
    }
    export namespace ContentType {
        export type CT = {
            "Content-Type": string
        };
        export function get(mimeType: string): CT {
            return {
                "Content-Type": mimeType
            };
        }
    }
    export namespace Accept {
        export type Acc = {
            "Accept": string
        };
        export function get(mimeType: string): Acc {
            return {
                Accept: mimeType
            };
        }
    }
    export namespace Authorization {
        export type Auth = {
            Authorization: string;
        };
        export function basic(username: string, password: string): Auth {
            const encoded = convert.toBase64Encoded(`${username}:${password}`);
            return {
                Authorization: `Basic ${encoded}`
            };
        }
        export function bearer(token: string): Auth {
            return {
                Authorization: `Basic ${token}`
            };
        }
        export type DigestOptions = {
            username: string;
            realm: string;
            uri: string;
            algorithm: string;
            nonce: string;
            nc: string;
            cnonce: string;
            qop: string;
            response: string;
            opaque: string;
        }
        export function digest(options: Partial<DigestOptions>): Auth {
            const authData = new Array<string>();
            if (options?.username) { authData.push(`username=${options.username}`); }
            if (options?.realm) { authData.push(`realm=${options.realm}`); }
            if (options?.uri) { authData.push(`uri=${options.uri}`); }
            if (options?.algorithm) { authData.push(`algorithm=${options.algorithm}`); }
            if (options?.nonce) { authData.push(`nonce=${options.nonce}`); }
            if (options?.nc) { authData.push(`nc=${options.nc}`); }
            if (options?.cnonce) { authData.push(`cnonce=${options.cnonce}`); }
            if (options?.qop) { authData.push(`qop=${options.qop}`); }
            if (options?.response) { authData.push(`response=${options.response}`); }
            if (options?.opaque) { authData.push(`opaque=${options.opaque}`); }
            return {
                Authorization: `Digest ${authData.join(', ')}`
            };
        }
    }
    export namespace Cookies {
        export type Cookie = {
            Cookie: string
        };
        export type SetCookie = {
            "Set-Cookie": string
        };
        export type SetCookieOptions = {
            key: string;
            val: string;
            expires?: string;
            secure?: boolean;
            httpOnly?: boolean;
        }
        export function cookie(...cookies: Array<Pick<SetCookieOptions, 'key' | 'val'>>): Cookie {
            const cookieStrings = new Array<string>();
            for (let c of cookies) {
                if (c.key && c.val) {
                    cookieStrings.push(`${c.key}=${c.val}`);
                }
            }
            return {
                Cookie: `${cookieStrings.join('; ')}`
            }
        }
        export function setCookie(cookie: SetCookieOptions): SetCookie {
            const valsArr = new Array<string>();
            if (cookie.key && cookie.val) {
                valsArr.push(`${cookie.key}=${cookie.val}`);
                if (cookie.expires) { valsArr.push(`Expires=${cookie.expires}`); }
                if (cookie.secure) { valsArr.push('Secure'); }
                if (cookie.httpOnly) { valsArr.push('HttpOnly'); }
            }
            return {
                "Set-Cookie": `${valsArr.join('; ')}`
            }
        }
    }
}
