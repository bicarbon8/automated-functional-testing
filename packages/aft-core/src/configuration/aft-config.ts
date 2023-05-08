import * as dotenv from "dotenv";
import { Class, JsonObject, JsonValue, RetryBackOffType } from "../helpers/custom-types";
import { fileio } from "../helpers/file-io";
import { LogLevel } from "../plugins/logging/log-level";

export class AftConfig {
    private readonly _cfg: JsonObject;
    private readonly _valueCache: Map<string, JsonValue>;
    private readonly _sectionCache: Map<string, {}>;

    constructor(config?: JsonObject) {
        this._cfg = config ?? fileio.readAs<JsonObject>('aftconfig.json') ?? {};
        this._valueCache = new Map<string, JsonValue>();
        this._sectionCache = new Map<string, {}>();
        dotenv.config();
    }
    
    get pluginsSearchDir(): string {
        return this.get('pluginsSearchDir', process.cwd());
    }
    get pluginNames(): Array<string> {
        return this.get('pluginNames', new Array<string>());
    }

    /**
     * looks for a value in the `aftconfig.json` file at the top level and if found attempts
     * to extract any environment variable set if the value matches a format of `%some_var_name%`
     * before returning the value or the specified `defaultVal` if nothing was found
     * @param key the configuration key
     * @param defaultVal a default value to return if no value is set for the specified `key`
     * @returns the value set in the `aftconfig.json` file for the specified `key` or `undefined`
     */
    get<T extends JsonValue>(key: string, defaultVal?: T): T {
        if (this._valueCache.has(key)) {
            return this._valueCache.get(key) as T;
        }
        let val: T = this._cfg[key] as T;
        if (val === null || val === undefined) {
            val = defaultVal as T;
        }
        if (typeof val === "string") {
            val = this.processEnvVars(val) as T;
        } else if (typeof val === "object") {
            val = this.processProperties(val);
        }
        if (val != null) {
            this.set(key, val);
        }
        return val;
    }

    set<T extends JsonValue>(key: string, val: T): void {
        if (val != null) {
            this._valueCache.set(key, val);
        } else {
            this._valueCache.delete(key);
        }
    }

    /**
     * looks for a top-level section in your `aftconfig.json` file with a name matching the passed in
     * `className` and returns it or a new instance of the `className` type
     * @param className a class of type `T` where the name of the class and the section name must match
     * @returns the section from `aftconfig.json` matching the name of the passed in `className` or a 
     * new instance of the `className` type
     */
    getSection<T extends {}>(className: Class<T> | string): T {
        let val: T;
        let key: string;
        if (typeof className === "function") {
            key = `${className.name}`;
        } else {
            key = className;
        }
        val = this._sectionCache.get(key) as T;
        if (!val) {
            val = this.get<T>(key);
            if (!val) {
                if (typeof className === "function") {
                    val = new className();
                } else {
                    val = {} as T;
                }
            }
            if (val && typeof className === "function") {
                // copy props to class
                const config = new className();
                for (var prop of Object.getOwnPropertyNames(config)) {
                    if (val[prop] != null) {
                        config[prop] = val[prop];
                    }
                }
                val = config as T;
            }
            this.setSection(key, val);
        }
        return val;
    }

    /**
     * adds the passed in `section` to the `ConfigManager` cache of `aftconfig.json`
     * sections so it will be used instead of the value from the actual JSON file
     * @param key adds the passed in `section` to the cache so it will be used
     * instead of reading from `aftconfig.json`
     * @param section an object containing properties
     */
    setSection<T extends {}>(key: string, section: T): void {
        if (section) {
            this._sectionCache.set(key, section);
        } else {
            this._sectionCache.delete(key);
        }
    }

    /**
     * iterates over all properties for the passed in `input` object and
     * if a property is a `string` it calls `processEnvVars` on the property
     * @param input an object that contains properties
     * @returns the input object with any string property values updated
     * based on the result of calling `processEnvVars`
     */
    processProperties<T extends {}>(input: T): T {
        if (input) {
            for (var prop of Object.keys(input)) {
                let val = input[prop];
                if (val != null) {
                    if (typeof val === "string") {
                        val = this.processEnvVars(val);
                    } else if (typeof val === "object") {
                        val = this.processEnvVars(val);
                    }
                    input[prop] = val;
                }
            }
        }
        return input;
    }

    /**
     * attempts to get an environment variable value for a given key if the passed
     * in `input` is in the format of `%some_env_var_key%`
     * @param input a string that might reference an environment var between two `%`
     * characters like `%some_env_var%` 
     * @returns the value of the environment variable
     */
    processEnvVars(input: string): string {
        if (input) {
            let regx = /^%(.*)%$/;
            if ((input?.match(regx)?.length ?? 0) > 0) {
                var envVarKey = input.match(regx)?.[1];
                if (envVarKey) {
                    let result = process.env[envVarKey];
                    if (result)
                    {
                        input = result;
                    }
                }
            }
        }
        return input;
    }
}

export const aftConfig: AftConfig = new AftConfig();