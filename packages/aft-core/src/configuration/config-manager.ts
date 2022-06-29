import { AftConfigProvider } from "./aftconfig-provider";
import { IConfigProvider } from "./i-config-provider";
import { ChainedProvider } from "./chained-provider";
import { EnvVarProvider } from "./envvar-provider";
import { OptionsProvider } from "./options-provider";

type ConfigKeyOptions = <T extends object>(configKey: string, options: T) => IConfigProvider<T>;

class ConfigManager {
    private readonly _default: ConfigKeyOptions = <T extends object>(configKey: string, options: T) => new ChainedProvider<T>([
        new OptionsProvider<T>(options),
        new EnvVarProvider<T>(configKey),
        new AftConfigProvider<T>(configKey)
    ]);
    private _override: ConfigKeyOptions;
    /**
     * returns a new `ConfigProvider` either using the `default` of a
     * `ChainedProvider` that reads from an `OptionsProvider` followed
     * by and `EnvVarProvider` followed by `AftConfigProvider` or using
     * the value specified using the `set` function.
     * @param configKey a configuration key to use in `ConfigProvider` instances that
     * require one
     * @param options an `object` containing options that override any environment
     * variables or `aftconfig.json` values
     * @returns either the default `ConfigProvider` or the one set using the `set`
     * function
     */
    get<T extends object>(configKey: string, options: T): IConfigProvider<T> {
        return (this._override) ? this._override<T>(configKey, options) : this._default<T>(configKey, options);
    }
    /**
     * this function allows for overriding the default `IConfigProvider` lookup chain
     * so that any future `IConfigProvider` implementations may be added in or replace
     * the existing `ChainedProvider`
     * ```typescript
     * ConfigManager.set(<T extends object>(configKey: string, options: T) => CustomConfigProvider<T>(configKey, options));
     * ```
     * @param func a `Function` accepting two arguments, a `configKey: string` and an
     * `options: object` and returning a `IConfigProvider` instance
     */
    set(func: ConfigKeyOptions): void {
        this._override = func;
    }
    /**
     * resets the `cfgmgr` to use the default provider chain
     */
    reset(): void {
        this.set(this._default);
    }
}

/**
 * calling `cfgmgr.get('someCustomKey', {'my_field_1': ObjectInstance, 'my_field_2': true ...})`
 * will (by default) return a `ChainedProvider` that uses the passed in `object` instance
 * followed by environment variables and then aftconfig.json to lookup a value when using the
 * returned `ChainedProvider.get<T>(key, defaultVal)` function.
 * 
 * calling `cfgmgr.set((configKey: string, options: object) => new CustomProvider(configKey))`
 * overrides the default returned `ChainedProvider` with a new `CustomProvider` instance that will
 * be returned from future `cfgmgr.get(...)` calls
 */
export const cfgmgr = new ConfigManager();