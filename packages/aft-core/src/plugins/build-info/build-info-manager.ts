import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { LogManager } from "../logging/log-manager";
import { BuildInfoPlugin, BuildInfoPluginOptions } from "./build-info-plugin";

export interface BuildInfoManagerOptions extends BuildInfoPluginOptions, PluginManagerOptions {
    _logMgr?: LogManager;
}

/**
 * loads and provides an interface between any `IBuildInfoPlugin`
 * to specify a plugin use the following `aftconfig.json` key:
 * ```
 * {
 *   ...
 *   "buildinfomanager": {
 *     "pluginNames": ["plugin-name"]
 *   }
 *   ...
 * }
 * ```
 */
export class BuildInfoManager extends PluginManager<BuildInfoPlugin, BuildInfoPluginOptions> {
    private _logMgr: LogManager;

    constructor(options?: BuildInfoManagerOptions) {
        super(options);
        this._logMgr = options?._logMgr || new LogManager({logName: this.optionsMgr.key, pluginNames: []});
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

export const buildinfo = new BuildInfoManager();