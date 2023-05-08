import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { SafeStringOption, convert } from "../../helpers/convert";
import { Err } from "../../helpers/err";
import { MachineInfoData, machineInfo } from "../../helpers/machine-info";
import { AftLog } from "../logging/aft-log";
import { pluginLoader } from "../plugin-loader";
import { IBuildInfoPlugin } from "./i-build-info-plugin";

export class AftBuildInfo {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<IBuildInfoPlugin>

    private readonly safeStrOpt: SafeStringOption[] = [{exclude: /[\()\;\\\/\|\<\>""'*&^%$#@!,.\-\+_=\?]/gi, replaceWith: ''}];
    
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this.plugins = pluginLoader.getPluginsByType<IBuildInfoPlugin>('build-info', this.aftCfg);
    }

    /**
     * generates a build specific string for use in identifying individual
     * test execution runs across multiple projects in a CICD environment
     * @returns either a string containing `buildName_buildNumber` or
     * if there are no enabled `BuildInfoPlugin` instances, a string
     * containing `USERNAME_MACHINENAME_YYYYMMDD`
     */
    async get(): Promise<string> {
        const bName = await this._buildName();
        const bNum = await this._buildNumber();
        return `${bName}_${bNum}`;
    }

    private async _buildName(): Promise<string> {
        const plugin = this.plugins.find(p => p?.enabled);
        if (plugin) {
            try {
                return plugin.buildName();
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.buildName': ${Err.short(e)}`
                });
            }
        }
        let mi: MachineInfoData = machineInfo.data;
        let username: string = convert.toSafeString(mi.user, this.safeStrOpt);
        let machine: string = convert.toSafeString(mi.hostname, this.safeStrOpt);
        return `${username.toLocaleUpperCase()}_${machine.toLocaleUpperCase()}`;
    }

    private async _buildNumber(): Promise<string> {
        const plugin = this.plugins.find(p => p?.enabled);
        if (plugin) {
            try {
                return plugin.buildNumber();
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.buildNumber': ${Err.short(e)}`
                });
            }
        }
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
        return now;
    }
}

export const aftBuildInfo = new AftBuildInfo();