import { JsonObject } from "../helpers/custom-types";
import { fileio } from "../helpers/file-io";
import { LogManager } from "../plugins/logging/log-manager";
import { IConfigProvider } from "./i-config-provider";
import { OptionsProvider } from "./options-provider";

export class AftConfigProvider<T extends object> implements IConfigProvider<T> {
    private _aftConfig: JsonObject;
    private _optsProvider: OptionsProvider<T>;
    
    public readonly configKey: string;

    constructor(configKey: string) {
        this.configKey = configKey;
    }

    /**
     * parses a 'aftconfig.json' file from the local execution directory
     * and returns it as a JavaScript object
     */
    get aftConfig(): JsonObject {
        if (!this._aftConfig) {
            try {
                this._aftConfig = fileio.readAs<JsonObject>('aftconfig.json');
            } catch (e) {
                LogManager.toConsole({name: this.constructor.name, message: e, level: 'warn'});
                this._aftConfig = {};
            }
        }
        return this._aftConfig;
    }

    get options(): OptionsProvider<T> {
        if (!this._optsProvider) {
            const conf = this.aftConfig[this.configKey] || {};
            this._optsProvider = new OptionsProvider<T>(conf);
        }
        return this._optsProvider;
    }
    
    async get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V> {
        return this.options.get(key, defaultVal);
    }
}