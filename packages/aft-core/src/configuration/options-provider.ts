import { IConfigProvider } from "./i-config-provider";
import { optmgr } from "./options-manager";

export class OptionsProvider<T extends object> implements IConfigProvider<T> {
    private readonly _options: T;
    
    constructor(options: T) {
        options = options || {} as T;
        this._options = optmgr.process(options);
    }

    async get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V> {
        let result: V = this._options[key] as V;
        return (result === undefined) ? defaultVal : result;
    }
}