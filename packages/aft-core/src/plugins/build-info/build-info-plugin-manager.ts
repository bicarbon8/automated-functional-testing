import { PluginManager, IPluginManagerOptions } from "../plugin-manager";
import { LoggingPluginManager } from "../logging/logging-plugin-manager";
import { AbstractBuildInfoPlugin, IBuildInfoPluginOptions } from "./ibuild-info-plugin";

export interface IBuildInfoPluginManagerOptions extends IBuildInfoPluginOptions, IPluginManagerOptions {
    _logMgr?: LoggingPluginManager;
}

/**
 * loads and provides an interface between any `IBuildInfoPlugin`
 * to specify a plugin use the following `aftconfig.json` key:
 * ```
 * {
 *   ...
 *   "buildinfopluginmanager": {
 *     "pluginNames": ["plugin-name"]
 *   }
 *   ...
 * }
 * ```
 */
export class BuildInfoPluginManager extends PluginManager<AbstractBuildInfoPlugin, IBuildInfoPluginOptions> {
    private _logMgr: LoggingPluginManager;

    constructor(options?: IBuildInfoPluginManagerOptions) {
        super(options);
        this._logMgr = options?._logMgr || new LoggingPluginManager({logName: this.optionsMgr.key, pluginNames: []});
    }

    async getBuildName(): Promise<string> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.getBuildName();
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return null;
        });
    }

    async getBuildNumber(): Promise<string> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.getBuildNumber();
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return null;
        });
    }
}

export module BuildInfoPluginManager {
    var _inst: BuildInfoPluginManager = null;
    export function instance(): BuildInfoPluginManager {
        if (_inst === null) {
            _inst = new BuildInfoPluginManager();
        }
        return _inst;
    }
}