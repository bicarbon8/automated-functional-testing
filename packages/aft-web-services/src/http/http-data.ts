import { Func, JsonObject } from "aft-core";
import { XML } from "../helpers/xml";
import { HttpResponse } from "./http-custom-types";

class HttpData {
    private readonly _xmlParser: Func<string, JsonObject>;

    constructor(xmlParser?: Func<string, JsonObject>) {
        this._xmlParser = xmlParser ?? XML.fromString;
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
            const contentType: string = response.headers['content-type'];
            if(contentType.match(/(xml|html)/) !== null) {
                const doc = this._xmlParser(response.data);
                return doc as T;
            }
        }
        return JSON.parse(response.data) as T;
    }
}

export const httpData = new HttpData();