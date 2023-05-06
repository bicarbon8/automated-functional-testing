import { Class, JsonObject } from "../helpers/custom-types";
import { fileio } from "../helpers/file-io";

export class AftConfig {
    private readonly _cfg: JsonObject;
    private readonly _sectionCache: Map<string, {}>;

    constructor(config?: JsonObject) {
        this._cfg = config ?? fileio.readAs<JsonObject>('aftconfig.json') ?? {};
        this._sectionCache = new Map<string, {}>();
    }

    /**
     * looks for a value in the `aftconfig.json` file at the top level and if found attempts
     * to extract any environment variable set if the value matches a format of `%some_var_name%`
     * before returning the value or the specified `defaultVal` if nothing was found
     * @param key the configuration key
     * @param defaultVal a default value to return if no value is set for the specified `key`
     * @returns the value set in the `aftconfig.json` file for the specified `key` or `undefined`
     */
    get<T extends string | number | boolean>(key: string, defaultVal?: T): T {
        let val: T = this._cfg[key] as T;
        if (val === null || val === undefined) {
            val = defaultVal as T;
        }
        if (typeof val === "string") {
            val = this.processEnvVars(val) as T;
        }
        return val;
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
        let possibleVal = this._sectionCache.get(key) ?? this._cfg[key];
        if (typeof possibleVal === "string") {
            val = JSON.parse(possibleVal) as T;
        } else {
            val = possibleVal as T;
        }
        if (!val) {
            if (typeof className === "function") {
                val = new className();
            } else {
                val = {} as T;
            }
        }
        val = this.processProperties(val);
        this.setSection(key, val);
        return val;
    }

    setSection<T extends {}>(key: string, section: T): void {
        if (key && section) {
            this._sectionCache.set(key, section);
        }
    }

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

export module AftConfig {
    export const inst = new AftConfig();
}