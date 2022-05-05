import * as fs from 'fs';
import * as path from 'path';
import { ProcessingResult } from '../helpers/processing-result';

class AftConfigManager {
    private _aftConfig: object;

    /**
     * loads the specified file and attempts to return it as the declared type
     * @param jsonFile full path and filename to JSON file to be parsed
     */
    async loadJsonFile<T>(jsonFile: string): Promise<T> {
        let config: T = await new Promise((resolve, reject) => {
            try {
                fs.readFile(jsonFile, function(err, data) {
                    if (err) {
                        reject(err.toString());
                    }
                    if (data) {
                        let fileContents: string = data.toString('utf8');
                        let jsonRes: ProcessingResult = AftConfigManager.isJsonString(fileContents);
                        if (jsonRes.success) {
                            resolve(jsonRes.obj as T);
                        } else {
                            reject(jsonRes.message);
                        }
                    }
                });
            } catch (e) {
                reject(e);
            }
        });
        return config;
    }

    /**
     * parses a 'aftconfig.json' file from the local execution directory
     * and returns it as a JavaScript object
     */
    async aftConfig(): Promise<object> {
        if (!this._aftConfig) {
            let currentDir: string = process.cwd();
            if (!currentDir.endsWith('/') && !currentDir.endsWith('\\')) {
                currentDir += path.sep;
            }
            this._aftConfig = await this.loadJsonFile<object>(currentDir + 'aftconfig.json')
            .catch(async (err) => {
                console.warn(err);
                return {}; // empty config
            });
        }
        return this._aftConfig;
    }

    /**
     * will lookup the value for a specified set of keys within the aftconfig.json
     * by recursing down until the last key is used. for example to get the value of "baz" from
     * {"foo": {"bar": {"baz": 123}}} you would specify a key of 'foo.bar.baz' which would 
     * return 123. alternatively, to get the value of "bar" you would specify a key of
     * 'foo.bar' which would return {"baz": 123}
     * @param keys the keys to be used in looking up values separated by the . character
     * @param defaultVal if no value found for the specified keys then this will be returned instead; default null
     */
    async get<T>(keys: string, defaultVal?: T): Promise<T> {
        let conf: object = await this.aftConfig();
        let val: T = this.getFrom<T>(conf, keys);
        
        return (val == null) ? defaultVal : val;
    }

    /**
     * will lookup the value for a specified set of keys within the passed in object
     * by recursing down until the last key is used. for example to get the value of "baz" from
     * {"foo": {"bar": {"baz": 123}}} you would specify a key of 'foo.bar.baz' which would 
     * return 123. alternatively, to get the value of "bar" you would specify a key of
     * 'foo.bar' which would return {"baz": 123}
     * @param obj the object to search for values within
     * @param keys the keys to be used in looking up values separated by the . character
     */
    getFrom<T>(obj: Record<string, any>, keys: string): T {
        let result: T;
        if (obj == null || keys == null || keys.length < 1) {
            return result;
        }
        let keysArray: string[] = keys.split('.');
        result = this._getFrom(obj, ...keysArray);
        return result;
    }

    /**
     * will check if the passed in 'str' string is a 
     * reference to an environment variable key and if so will
     * lookup the value and return otherwise it will return null
     * @param str the value to be parsed to determine if it is an
     * Environment Variable reference
     */
    static isEnvVar(str: string): ProcessingResult {
        if (str) {
            let matchResults = str.match(/^%(.*)%$/);
            if (matchResults && matchResults.length > 0) {
                let envValStr: string = process.env[matchResults[1]];
                return {obj: envValStr, success: true};
            }
        }
        return {success: false};
    }

    /**
     * verifies that the passed in string is a valid
     * JSON object that can successfully be parsed with the 
     * JSON.parse command
     * @param str the string to be tested for validity
     */
    static isJsonString(str: string): ProcessingResult {
        let err: string = null;
        if (str) {        
            try {
                let jsonObj: object = JSON.parse(str);
                return {obj: jsonObj, success: true};
            } catch (e) { 
                err = `[isJsonString] for string value of '${str}' threw an error of: ${e}`;
            }
        } else {
            err = `[isJsonString] for string value of '${str}' is not valid.`
        }
        return {success: false, message: err};
    }

    /**
     * recurses the passed in `obj` using the passed in array of `keys`
     * @param obj the object to get the value of a property from
     * @param keys the array of keys to recurse through
     * @returns a value from the last key or undefined if not found
     */
    private _getFrom<T>(obj: Record<string, any>, ...keys: string[]): T {
        let result: T;
        const currentKey: string = keys.shift();
        if (currentKey) {
            let res = obj[currentKey];

            if (keys.length > 0) {
                if (res) {
                    result = this._getFrom<T>(res, ...keys);
                } // else return undefined
            } else {
                if (typeof res === 'string') {
                    result = this._processString<T>(res);
                } else {
                    result = res as T;
                }
            }
        }

        return result;
    }

    /**
     * attempts to extract an object from the passed in string if that
     * string references an environment variable key (%key%) by first
     * getting the variable and then attempting to parse it as JSON. if
     * it can be parsed as JSON an object is returned otherwise the string
     * value will be returned which will be undefined if some other type
     * is expected
     * @param str input string that may contain an environment key
     * @returns an object of the specified type or undefined
     */
    private _processString<T>(str: string): T {
        let result: T;
        const envRes: ProcessingResult = AftConfigManager.isEnvVar(str);
        if (envRes.success) {
            const jsonRes: ProcessingResult = AftConfigManager.isJsonString(envRes.obj);
            if (jsonRes.success) {
                result = jsonRes.obj;
            } else {
                result = envRes.obj;
            }
        } else {
            result = str as unknown as T;
        }
        return result;
    }
}

export const aftconfig = new AftConfigManager();