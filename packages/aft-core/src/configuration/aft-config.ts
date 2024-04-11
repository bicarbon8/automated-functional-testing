import * as fs from 'node:fs';
import * as path from 'node:path';
import * as process from 'node:process';
import * as dotenv from "dotenv";
import { Class, JsonObject, JsonValue } from "../helpers/custom-types";
import { fileio } from "../helpers/file-io";
import { LogLevel } from "../logging/log-level";
import { PluginLocator } from '../plugins/plugin-locator';

/**
 * class providing configuration used by AFT and it's plugins
 * for reading in configuration an `aftconfig.json`, `aftconfig.js`, `aftconfig.cjs`
 * or `aftconfig.mjs` file at the project root. this configuration can be read as a
 * top-level field using `aftConfig.get('field_name')` or `aftConfig.get('field_name',
 * defaultVal)` and can also be set without actually modifying the values in your
 * `aftconfig.json` using `aftConfig.set('field_name', val)`. additionally,
 * configuration classes can be read using `AftConfig` with the
 * `aftConfig.getSection(ConfigClass)` which will read from your `aftconfig.json`
 * file for a field named `ConfigClass`
 * > NOTE: 
 * > - when a new instance of `AftConfig` is created the `dotenv` package is run and any
 * `.env` file found at your project root (`process.cwd()`) will be processed into your
 * environment variables making it easier to load values when developing and testing locally.
 * > - if using a javascript `aftconfig` file, you must export the config object using
 * `module.exports = { ... }`
 * 
 * Ex: with an `aftconfig.json` containing:
 * ```json
 * {
 *     "SomeCustomClassConfig": {
 *         "configField1": "%your_env_var%",
 *         "configField2": "some-value",
 *         "configField3": ["foo", true, 10]
 *     }
 * }
 * ```
 * and with the following environment variables set:
 * > export your_env_var="an important value"
 * 
 * and a config class of:
 * ```typescript
 * export class SomeCustomClassConfig {
 *     configField1: string = 'default_value_here';
 *     configField2: string = 'another_default_value';
 *     configField3: Array<string | boolean | number> = ['default_val'];
 *     configField4: string = 'last_default_value';
 * }
 * ```
 * 
 * can be accessed using an `AftConfig` instance as follows:
 * ```typescript
 * const config = aftConfig.getSection(SomeCustomClassConfig); // or new AftConfig().getSection(SomeCustomClassConfig);
 * config.configField1; // returns "an important value"
 * config.configField2; // returns "some-value"
 * config.configField3; // returns ["foo", true, 10] as an array
 * config.configField4; // returns "last_default_value"
 * ```
 * 
 * and if you wish to entirely disregard the configuration specified in your
 * `aftconfig.json` file you can use the following (still based on the above example):
 * ```typescript
 * const config = new AftConfig({
 *     SomeCustomClassConfig: {
 *         configField1: 'custom_value_here'
 *     }
 * });
 * config.configField1; // returns "custom_value_here"
 * config.configField2; // returns "another_default_value"
 * config.configField3; // returns ["default_val"] as an array
 * config.configField4; // returns "last_default_value"
 * ```
 */
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
     * used by `AftLogger` to limit console output by importance
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

/**
 * GLOBAL class providing configuration used by AFT and it's plugins
 * for reading in configuration an `aftconfig.json`, `aftconfig.js`, `aftconfig.cjs`
 * or `aftconfig.mjs` file at the project root. this configuration can be read as a
 * top-level field using `aftConfig.get('field_name')` or `aftConfig.get('field_name',
 * defaultVal)` and can also be set without actually modifying the values in your
 * `aftconfig.json` using `aftConfig.set('field_name', val)`. additionally,
 * configuration classes can be read using `AftConfig` with the
 * `aftConfig.getSection(ConfigClass)` which will read from your `aftconfig.json`
 * file for a field named `ConfigClass`
 * > NOTE: 
 * > - when a new instance of `AftConfig` is created the `dotenv` package is run and any
 * `.env` file found at your project root (`process.cwd()`) will be processed into your
 * environment variables making it easier to load values when developing and testing locally.
 * > - if using a javascript `aftconfig` file, you must export the config object using
 * `module.exports = { ... }`
 */
export const aftConfig: AftConfig = new AftConfig();
