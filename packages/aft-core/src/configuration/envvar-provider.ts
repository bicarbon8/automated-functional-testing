import { IConfigProvider } from "./i-config-provider";

export class EnvVarProvider<T extends object> implements IConfigProvider<T> {
    public readonly varPrefix: string;
    
    constructor(variableNamePrefix: string) {
        this.varPrefix = variableNamePrefix;
    }
    
    async get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V> {
        let result: V;
        const genKey: string = `${this.varPrefix}_${String(key)}`;
        const val: string = process.env[genKey];
        if (val !== undefined) {
            let res: unknown;
            try {
                res = JSON.parse(val) as V;
            } catch (e) {
                res = val;
            }
            result = res as V;
        }
        return (result === undefined) ? defaultVal : result;
    }
}