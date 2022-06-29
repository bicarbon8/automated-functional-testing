import { Merge } from "../helpers/custom-types";
import { LogManager } from "./logging/log-manager";
import { Plugin } from "./plugin";
import { PluginManager, PluginManagerOptions } from "./plugin-manager";

export type PluginManagerWithLoggingOptions = Merge<PluginManagerOptions, {
    logName?: string;
}>;

export abstract class PluginManagerWithLogging<T extends Plugin<any>, Tc extends PluginManagerWithLoggingOptions> extends PluginManager<T, Tc> {
    private _logMgr: LogManager;

    constructor(options?: Tc) {
        super(options);
    }

    override config<K extends keyof Tc, V extends Tc[K]>(key: K, defaultVal?: V): Promise<V> {
        return super.config(key, defaultVal) as Promise<V>;
    }

    async logMgr(): Promise<LogManager> {
        if (!this._logMgr) {
            const logName = await this.config('logName', this.constructor.name);
            this._logMgr = new LogManager({logName: logName});
        }
        return this._logMgr;
    }
}