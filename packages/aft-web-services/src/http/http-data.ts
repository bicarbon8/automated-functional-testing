import { JsonObject } from "aft-core";
import { XML } from "../helpers/xml";
import { HttpResponse } from "./http-custom-types";
import { DOMParser } from 'xmldom';

class HttpData {
    private readonly _xmlParser: DOMParser;

    constructor() {
        this._xmlParser = new DOMParser();
    }

    /**
     * attempts to parse the contents of this `HttpResponse.data` into the specified
     * type
     * 
     * NOTE: parsing attempts to read the `content-type` header and if it contains
     * `html` or `xml` it will parse the data string as XML, otherwise as JSON
     * @returns the contents of this `HttpResponse.data` string parsed into an object
     * of the specified type. 
     */
    as<T extends JsonObject>(response: HttpResponse): T {
        if (response.headers && response.headers['content-type']) {
            let contentType: string = response.headers['content-type'];
            if(contentType.match(/(xml|html)/) !== null) {
                let doc: Document = this._xmlParser.parseFromString(response.data, 'text/xml');
                return XML.toObject(doc);
            }
        }
        return JSON.parse(response.data);
    }
}

export const httpData = new HttpData();