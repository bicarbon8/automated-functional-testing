import { IncomingHttpHeaders } from "http";
import { XML } from "../helpers/xml";
import { HttpResponseOptions } from "./http-response-options";
import { DOMParser } from 'xmldom';

export class HttpResponse implements HttpResponseOptions {
    headers?: IncomingHttpHeaders;
    data?: string;
    statusCode?: number;

    private _xmlParser: DOMParser;

    constructor(options?: HttpResponseOptions) {
        this._xmlParser = new DOMParser();

        this.headers = options?.headers;
        this.data = options?.data;
        this.statusCode = options?.statusCode;
    }

    dataAs<T>(): T {
        if (this.headers && this.headers['content-type']) {
            let contentType: string = this.headers['content-type'];
            if(contentType.match(/(xml|html)/) !== null) {
                let doc: Document = this._xmlParser.parseFromString(this.data, 'text/xml');
                return XML.toObject(doc);
            }
        }
        return JSON.parse(this.data);
    }
}