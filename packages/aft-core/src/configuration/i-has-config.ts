export interface IHasConfig<T extends object> {
    config<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): Promise<V>;
}