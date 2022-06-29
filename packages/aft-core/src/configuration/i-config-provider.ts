export interface IConfigProvider<T extends object> {
    get<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V>;
}