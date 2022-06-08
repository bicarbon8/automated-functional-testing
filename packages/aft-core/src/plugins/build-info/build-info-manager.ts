import { LogManager } from "../logging/log-manager";
import { BuildInfoPlugin, BuildInfoPluginOptions } from "./build-info-plugin";
import { machineInfo, MachineInfoData } from "../../helpers/machine-info";
import { convert, SafeStringOption } from "../../helpers/convert";
import { PluginManagerWithLogging, PluginManagerWithLoggingOptions } from "../plugin-manager-with-logging";
import { Merge } from "../../helpers/custom-types";
import { IConfigProvider } from "../../configuration/i-config-provider";

export type BuildInfoManagerOptions = Merge<PluginManagerWithLoggingOptions, BuildInfoPluginOptions>;

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
export class BuildInfoManager extends PluginManagerWithLogging<BuildInfoPlugin<any>, BuildInfoManagerOptions> {
    private readonly safeStrOpt: SafeStringOption[] = [{exclude: /[\()\;\\\/\|\<\>""'*&^%$#@!,.\-\+_=\?]/gi, replaceWith: ''}];
    
    /**
     * returns a build name as provided by the first enabled plugin
     * @returns the build name returned by the first enabled plugin
     * or null if none exist
     */
    async buildName(): Promise<string> {
        let buildName: string = await this.first()
        .then((p: BuildInfoPlugin<any>) => p?.buildName()
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling ${p?.constructor.name || 'unknown'}.buildName() due to: ${err}`));
                return null;
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return null;
        });
        return buildName;
    }

    /**
     * returns a build number as a string as provided by the first enabled
     * plugin
     * @returns the build number returned by the first enabled plugin
     * or null if none exist
     */
    async buildNumber(): Promise<string> {
        let buildNumber: string = await this.first()
        .then((p: BuildInfoPlugin<any>) => p?.buildNumber()
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling ${p?.constructor.name || 'unknown'}.buildNumber() due to: ${err}`));
                return `${Date.now()}`;
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return `${Date.now()}`;
        });
        return buildNumber;
    }

    /**
     * generates a build specific string for use in identifying individual
     * test execution runs across multiple projects in a CICD environment
     * @returns either a string containing `buildName_buildNumber` or
     * if there are no enabled `BuildInfoPlugin` instances, a string
     * containing `username_machineName_YYYYMMDD`
     */
    async get(): Promise<string> {
        let job: string = await this.buildName();
        if (job) {
            job = convert.toSafeString(job, this.safeStrOpt);
            let build: string = await this.buildNumber();
            build = convert.toSafeString(build);
            return `${job}_${build}`;
        } else {
            let mi: MachineInfoData = machineInfo.data;
            let username: string = convert.toSafeString(mi.user, this.safeStrOpt);
            let machine: string = convert.toSafeString(mi.hostname, this.safeStrOpt);
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