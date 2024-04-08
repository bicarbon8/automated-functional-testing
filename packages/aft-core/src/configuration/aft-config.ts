import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import * as dotenv from "dotenv";
import { Class, JsonObject, JsonValue, RetryBackOffType } from "../helpers/custom-types";
import { fileio } from "../helpers/file-io";
import { LogLevel } from "../logging/log-level";
import { PluginLocator } from '../plugins/plugin-locator';

export class AftConfig {
    private readonly _cfg: JsonObject;
    private readonly _valueCache: Map<string, JsonValue>;
    private readonly _sectionCache: Map<string, {}>;
    private static readonly _fileCandidates = Object.freeze(new Array<string>(
        'aftconfig.json',
        'aftconfig.js',
        'aftconfig.cjs',
        'aftconfig.mjs'
    ));

    constructor(config?: JsonObject) {
        this._cfg = config;
        if (!this._cfg) {
            this._cfg = this._loadConfigFile();
        }
        this._valueCache = new Map<string, JsonValue>();
        this._sectionCache = new Map<string, {}>();
        dotenv.config();
    }
    /**
     * an array of plugin filenames (these must also match the lowercase plugin class name minus
     * any `-`, `_` and `.` characters) to load via the `pluginLoader`
     * 
     * ex:
     * ```json
     * // aftconfig.json
     * {
     *     "plugins": [
     *         "my-plugin",
     *         {"name": "my-other-plugin", "searchDir": "/full/path/to/my-other-plugin/"}
     *     ]
     * }
     * ```
     * would match with the following plugin classes
     * ```javascript
     * // <project-root>/any/subdirectory/my-plugin.js
     * export class MyPlugin extends Plugin {
     *     doStuff = () => 'stuff';
     * }
     * ```
     * and
     * ```javascript
     * // /full/path/to/my-other-plugin.js
     * export class MyOtherPlugin extends Plugin {
     *     doOtherStuff = () => 'other stuff';
     * }
     * ```
     * @default []
     */
    get plugins(): Array<string | PluginLocator> {
        return this.get('plugins', new Array<string | PluginLocator>());
    }
    /** 
     * used by `Reporter` 
     * @default 'warn'
     */
    get logLevel(): LogLevel {
        return this.get<LogLevel>('logLevel', 'warn');
    }
    /** 
     * used by `ExpiringFileLock` to set the number of milliseconds to wait for a lock to become available
     * @default 10000
     */
    get fileLockMaxWait(): number {
        return this.get('fileLockMaxWait', 10000);
    }
    /** 
     * used by `ExpiringFileLock` to set the number of milliseconds to hold a lock 
     * @default 10000
     */
    get fileLockMaxHold(): number {
        return this.get('fileLockMaxHold', 10000);
    }
    /** 
     * used by `FileSystemMap` to set the directory where the data is written to the file system 
     * @default 'FileSystemMap'
     */
    get fsMapDirectory(): string {
        return this.get('fsMapDirectory', 'FileSystemMap');
    }
    /** 
     * used by `retry` to set the maximum number of attempts 
     * @default Infinity
     */
    get retryMaxAttempts(): number {
        return this.get('retryMaxAttempts', Infinity);
    }
    /** 
     * used by `retry` to set the retry delay back off type 
     * @default 'constant'
     */
    get retryBackOffType(): RetryBackOffType {
        return this.get<RetryBackOffType>('retryBackOffType', 'constant');
    }
    /** 
     * used by `retry` to set the starting millisecond delay between each retry attempt 
     * @default 1
     */
    get retryDelayMs(): number {
        return this.get('retryDelayMs', 1);
    }
    /** 
     * used by `retry` to set the maximum duration in milliseconds to attempt retries
     * @default Infinity
     */
    get retryMaxDurationMs(): number {
        return this.get('retryMaxDurationMs', Infinity);
    }
    /** 
     * used by `retry` to indicate if a failure to get success should result in a `Promise.reject`
     * on completion or simply returning `null`
     * @default true
     */
    get retryRejectOnFail(): boolean {
        return this.get('retryRejectOnFail', true);
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
                for (const prop of Object.getOwnPropertyNames(val)) {
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
            for (const prop of Object.keys(input)) {
                let val = input[prop];
                if (val != null) {
                    if (typeof val === "string") {
                        val = this.processEnvVars(val);
                    } else if (typeof val === "object") {
                        val = this.processProperties(val);
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
        if (input && typeof input === 'string') {
            const regx = /^%(.*)%$/;
            if ((input?.match(regx)?.length ?? 0) > 0) {
                const envVarKey = input.match(regx)?.[1];
                if (envVarKey) {
                    const result = process.env[envVarKey];
                    if (result) {
                        input = result;
                    }
                }
            }
        }
        return input;
    }

    private _loadConfigFile(): JsonObject {
        const cfgFile = AftConfig._fileCandidates
            .map(c => path.resolve(process.cwd(), c))
            .find(c => fs.existsSync(c));
        if (cfgFile) {
            try {
                if (cfgFile.endsWith('.json')) {
                    return fileio.readAs<JsonObject>(cfgFile);
                } else {
                    return require(cfgFile) as JsonObject; // eslint-disable-line no-undef
                }
            } catch {
                /* ignore */
            }
        }
        return {};
    }
}

export const aftConfig: AftConfig = new AftConfig();
