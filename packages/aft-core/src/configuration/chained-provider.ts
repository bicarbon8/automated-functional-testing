import { IConfigProvider } from "./i-config-provider";

export class ChainedProvider<T extends object> implements IConfigProvider<T> {
    private _providers: IConfigProvider<T>[];

    constructor(configProviders: IConfigProvider<T>[]) {
        this._providers = configProviders || [];
    }

    async get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V> {
        let result: V;
        for (var i=0; i<this._providers.length; i++) {
            let provider = this._providers[i];
            result = await provider?.get<K, V>(key).catch((err) => undefined);
            if (result !== undefined) {
                break;
            }
        }
        return (result === undefined) ? defaultVal : result;
    }
}