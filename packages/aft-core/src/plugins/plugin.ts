import { IHasOptions } from "../configuration/i-has-options";
import { optmgr } from "../configuration/options-manager";

export type PluginOptions = {
    enabled?: boolean;
}

/**
 * interface to be implemented by any Plugin implementation
 */
export abstract class Plugin<T extends PluginOptions> implements IHasOptions<T> {
    private readonly _opts: T;

    private _enabled: boolean;

    constructor(options?: T) {
        options = options || {} as T;
        this._opts = optmgr.process(options);
    }

    option<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): V {
        const result: V = this._opts[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    get enabled(): boolean {
        if (this._enabled == null) {
            this._enabled = this.option('enabled', true);
        }
        return this._enabled;
    }
}