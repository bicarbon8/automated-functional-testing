class OptionsManager {
    /**
     * iterates through the values of any properties on the passed
     * in `object` and if they are a string, attempts to extract
     * environment variables from them and / or convert them into
     * an object. For example:
     * ```typescript
     * const options = {
     *     "foo": "%some_env_var_key%",
     *     "bar": "[10, true, 'baz']"
     * }
     * const updated = optmgr.process(options);
     * ```
     * with an environment variable of `some_env_var_key` set to `"24"`.
     * 
     * would result in the following object being returned:
     * ```typescript
     * {
     *     "foo": 24,
     *     "bar": [10, true, "baz"]
     * }
     * ```
     * @param options an object to be processed
     * @returns the processed object
     */
    process<T extends object>(options: T): T {
        let result: T;
        if (options) {
            const keys = Object.keys(options);
            for (var i=0; i<keys.length; i++) {
                let key = keys[i];
                let val = options[key];
                if (typeof val === 'string') {
                    val = this._processEnvVars(val);
                    val = this._processJson(val);
                } else if (typeof val === 'object') {
                    val = this.process(val);
                }
                options[key] = val;
            }
            result = options;
        }
        return result;
    }

    /**
     * attempts to read a value from the Process Environment Variables
     * if the passed in `str` is wrapped by a `%` at the beginning and
     * end like `%some_variable_key%`
     * @param str input string that may contain an environment key
     * @returns an object of the specified type or undefined
     */
    private _processEnvVars(str: string): string {
        let result: string = str;
        const matchResults = str.match(/^%(.*)%$/);
        if (matchResults && matchResults.length > 0) {
            let envValStr: string = process.env[matchResults[1]];
            result = envValStr || str;
        }
        return result;
    }

    /**
     * attempts to call `JSON.parse` on the passed in `str` and returns
     * the resulting value or the original `str` if an error occurs
     * @param str input string that may be parsable by `JSON.parse`
     * @returns the result of calling `JSON.parse` or the original `str`
     */
    private _processJson(str: string): string | object {
        let result: string | object;
        try {
            result = JSON.parse(str);
        } catch (e) {
            result = str;
        }
        return result;
    }
}

/**
 * iterates through the values of any properties on the passed
 * in `object` and if they are a string, attempts to extract
 * environment variables from them and / or convert them into
 * an object. For example:
 * ```typescript
 * const options = {
 *     "foo": "%some_env_var_key%",
 *     "bar": "[10, true, 'baz']"
 * }
 * const updated = optmgr.process(options);
 * ```
 * with an environment variable of `some_env_var_key` set to `"24"`.
 * 
 * would result in the following object being returned:
 * ```typescript
 * {
 *     "foo": 24,
 *     "bar": [10, true, "baz"]
 * }
 * ```
 */
export const optmgr = new OptionsManager();