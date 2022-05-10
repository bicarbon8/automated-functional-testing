import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { LogManager } from "../logging/log-manager";
import { BuildInfoPlugin, BuildInfoPluginOptions } from "./build-info-plugin";
import { MachineInfo, MachineInfoData } from "../../helpers/machine-info";
import { convert, SafeStringOption } from "../../helpers/converter";

export interface BuildInfoManagerOptions extends BuildInfoPluginOptions, PluginManagerOptions {
    _logMgr?: LogManager;
}

/**
 * loads and provides an interface between any `BuildInfoPlugin`
 * that provides CICD build details such as TeamCity, Jenkins,
 * Bamboo or Octopus.
 * 
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
    private readonly safeStrOpt: SafeStringOption[] = [{exclude: /[\()\;\\\/\|\<\>""'*&^%$#@!,.\-\+_=\?]/gi, replaceWith: ''}];
    private _logMgr: LogManager;

    constructor(options?: BuildInfoManagerOptions) {
        super(options);
        this._logMgr = options?._logMgr || new LogManager({logName: this.optionsMgr.key, pluginNames: []});
    }

    /**
     * returns a build name as provided by the first enabled plugin
     * @returns the build name returned by the first enabled plugin
     * or null if none exist
     */
    async getBuildName(): Promise<string> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.getBuildName();
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return null;
        });
    }

    /**
     * returns a build number as a string as provided by the first enabled
     * plugin
     * @returns the build number returned by the first enabled plugin
     * or null if none exist
     */
    async getBuildNumber(): Promise<string> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.getBuildNumber();
        }).catch(async (err) => {
            await this._logMgr.trace(err);
            return null;
        });
    }

    /**
     * generates a build specific string for use in identifying individual
     * test execution runs across multiple projects in a CICD environment
     * @returns either a string containing `buildName_buildNumber` or
     * if there are no enabled `BuildInfoPlugin` instances, a string
     * containing `username_machineName_YYYYMMDD`
     */
    async get(): Promise<string> {
        let job: string = await this.getBuildName();
        if (job) {
            job = convert.toSafeString(job, this.safeStrOpt);
            let build: string = await this.getBuildNumber();
            build = convert.toSafeString(build);
            return `${job}_${build}`;
        } else {
            let mi: MachineInfoData = await MachineInfo.get();
            let username: string = convert.toSafeString(mi.user, this.safeStrOpt);
            let machine: string = convert.toSafeString(mi.name, this.safeStrOpt);
            let d = new Date();
            let month: number = d.getUTCMonth() + 1;
            let monthStr: string = month.toString();
            if (month < 10) {
                monthStr = '0' + month;
            }
            let day: number = d.getUTCDate();
            let dayStr: string = day.toString();
            if (day < 10) {
                dayStr = '0' + day;
            }
            let now: string = convert.toSafeString(`${d.getUTCFullYear()}${monthStr}${dayStr}`, this.safeStrOpt);
            return `${username}_${machine}_${now}`;
        }
    }
}

export const buildinfo = new BuildInfoManager();