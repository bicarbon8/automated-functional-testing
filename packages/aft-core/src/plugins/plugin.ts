import { OptionsManager } from "../configuration/options-manager";
import { IDisposable } from "../helpers/idisposable";

/**
 * a base options object that must be implemented by any
 * Plugin implementation's constructor options
 */
export interface PluginOptions {
    /**
     * [OPTIONAL] if not provided, will default to value in `aftconfig.json` or `true`
     */
    enabled?: boolean;
    /**
     * [OPTIONAL] if not provided a new {OptionsManager} will be created
     */
    _optMgr?: OptionsManager;
}

/**
 * base class to be extended by any Plugin implementation.
 * 
 * NOTE:
 * * the `onLoad` function is called automatically after the plugin instance is created
 * * the `dispose` function is only called if the plugin is used within a {using} call
 * ```
 * await using(pluginInstance, (plugin) => {
 *     plugin.doStuff();
 * }); // `plugin.dispose` is called here
 * ```
 */
export abstract class Plugin<T extends PluginOptions> implements IDisposable {
    private _enabled: boolean;
    readonly optionsMgr: OptionsManager;
    constructor(options?: T) {
        this.optionsMgr = new OptionsManager(this.constructor.name.toLowerCase(), options);
    }
    async enabled(): Promise<boolean> {
        if (this._enabled === undefined) {
            this._enabled = await this.optionsMgr.getOption('enabled', true);
        }
        return this._enabled;
    }
    abstract onLoad(): Promise<void>;
    abstract dispose(error?: Error): Promise<void>;
}