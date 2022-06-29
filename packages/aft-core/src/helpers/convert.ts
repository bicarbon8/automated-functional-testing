import { JsonObject } from "./custom-types";

export type SafeStringOption = {
    exclude: string | RegExp;
    replaceWith: string;
};

export module SafeStringOption {
    export const defaults: SafeStringOption[] = [
        {exclude: /[\/\\\{\}\(\)\,\.\-]/g, replaceWith: '_'},
        {exclude: /[\s]+/g, replaceWith: '_'},
        {exclude: /[\$\^\&\*\%\£\€\~\#\@\!\|\?\'\"\:\;\=\+\[\]]/g, replaceWith: ''}
    ];
}

class Convert {
    /**
     * function will Base64 encode the passed in string
     * @param input a string to be Base64 encoded
     */
    toBase64Encoded(input: string) {
        return Buffer.from(input).toString('base64');
    }

    /**
     * function will decode a Base64 encoded string to ASCII
     * @param base64Str a Base64 encoded string to be decoded
     */
    fromBase64Encoded(base64Str: string) {
        return Buffer.from(base64Str, 'base64').toString('ascii');
    }

    /**
     * function will return the number of milliseconds elapsed since the 
     * passed in timestamp
     * @param startTime the value from calling 'new Date().getTime()' at the
     * point in time when some event has started.
     */
    toElapsedMs(startTime: number): number {
        return new Date().getTime() - startTime;
    }

    /**
     * function will replace any occurrences of the passed in 'excludes' strings with
     * the value of the passed in 'replaceWith' string
     * @param input the original string to process
     * @param options an array of {exclude: string | RegExp, replaceWith: string} objects to 
     * use in processing the input string
     */
    toSafeString(input: string, options: SafeStringOption[] = SafeStringOption.defaults): string {
        let output: string = input;
        if (input) {
            for (var i=0; i<options.length; i++) {
                let o: SafeStringOption = options[i];
                output = output.replace(o.exclude, o.replaceWith);
            }
        }
        return output;
    }

    /**
     * converts the passed in `Map` to a JSON string
     * @param mapObj the `Map` to be converted to a string
     * @returns a JSON string of the format `[["key", "val"],["key", "val"]]`
     */
    mapToString(mapObj: Map<any, any>): string {
        return JSON.stringify(Array.from(mapObj.entries()));
    }

    /**
     * converts the passed in string to a valid `Map` object
     * @param mapStr a JSON string representation of a `Map` as an array
     * containing arrays of key-value pairs like `[["key", "val"],["key", "val"]]`
     * @returns a `Map` object
     */
    stringToMap(mapStr: string): Map<any, any> {
        return new Map<any, any>(JSON.parse(mapStr));
    }

    /**
     * converts the passed in object from a complex
     * type possibly containing functions and classes
     * to a simple JSON object
     * @param obj an input object to be converted
     * @returns a valid `JsonObject` typed object
     */
    toJsonObject(obj: any): JsonObject {
        if (obj) {
            return JSON.parse(JSON.stringify(obj));
        }
        return {};
    }
}

export const convert = new Convert();