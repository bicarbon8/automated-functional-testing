export interface IHasOptions<T extends object> {
    option<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): V;
}