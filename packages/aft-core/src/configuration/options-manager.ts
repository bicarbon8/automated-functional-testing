import { aftconfig } from "./aftconfig-manager";

/**
 * **WARNING**
 * 
 * DO NOT USE FOR COMPLEX CLASSES! ONLY SIMPLE JSON OBJECTS
 * SUPPORTED
 * 
 * manages the retrieval of options from either a passed in JSON
 * object or, if not found there, by looking in the `aftconfig.json` section
 * specified by the `key` passed to the constructor followed by any
 * specified `keys` passed to the `get` function. For example, given a
 * key of `myspecialkey` and object of:
 * ```json
 * {
 *   "foo": "this is 'foo'",
 *   "bar": true,
 *   "baz": {
 *     "foo": "this is 'baz.foo'"
 *   }
 * }
 * ```
 * then calling `get('baz.foo')` would return `"this is 'baz.foo'"` and
 * calling `get('baz.bar')` would look in the `aftconfig.json` file because
 * the value does not exist in the above JSON object and if it contained
 * the following:
 * ```json
 * {
 *   ...
 *   "myspecialkey": {
 *     "baz": {
 *       "bar": "this is 'myspecialkey.baz.bar'"
 *     }
 *   }
 *   ...
 * }
 * ```
 * would then return `"this is 'myspecialkey.baz.bar'"`, otherwise `null`
 */
export class OptionsManager {
    readonly key: string;

    private _options: Record<string, any>;

    constructor(key: string, options?: Record<string, any>) {
        this.key = key;
        this._options = options || {};
    }

    /**
     * function will lookup a value from the optional options passed to the class
     * and if not found will then check for the same in the `aftconfig.json` under
     * the configuration key specified in the constructor plus the passed in `keys`
     * @param keys the lookup keys to be used to retrieve a value
     * @param defaultVal a default value to return in the case that no value is found
     */
    async get<Tval>(keys?: string, defaultVal?: Tval): Promise<Tval> {
        if (keys) {
            let val: Tval = aftconfig.getFrom<Tval>(this._options, keys);
            if (val === undefined) {
                val = await aftconfig.get<Tval>(`${this.key}.${keys}`, defaultVal);
            }
            return val;
        } 
        let val: Tval = await aftconfig.get<Tval>(`${this.key}`, defaultVal);
        val = val || {} as Tval;
        return {...val, ...this._options} as Tval;
    }
}