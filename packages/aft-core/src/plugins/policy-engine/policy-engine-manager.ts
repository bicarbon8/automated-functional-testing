import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { ProcessingResult } from "../../helpers/custom-types";
import { Err } from "../../helpers/err";
import { LogManager } from "../logging/log-manager";
import { LogMessageData } from "../logging/log-message-data";
import { pluginLoader } from "../plugin-loader";
import { PolicyEnginePlugin } from "./policy-engine-plugin";

export class PolicyEngineManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<PolicyEnginePlugin>;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this.plugins = pluginLoader.getPluginsByType(PolicyEnginePlugin, this.aftCfg);
    }

    /**
     * iterates over all enabled `IPolicyEnginePlugin` implementations calling `shouldRun`
     * and if any of the results return `false` then a `ShouldRunResult` containing `false`
     * and a reason comprised of all plugin reasons will be returned, otherwise `true`
     * @param testId the test case id to check
     * @returns a `ShouldRunResult` containing `shouldRun=true` if test should be run
     * otherwise `false` and a `reason` stating why
     */
    async shouldRun(testId: string): Promise<ProcessingResult<boolean>> {
        const plugins = this._getEnabledPlugins();
        if (plugins?.length > 0) {
            const results = await Promise.all(plugins.map(async p => {
                try {
                    return await p.shouldRun(testId);
                } catch (e) {
                    let logData: LogMessageData = {
                        name: this.constructor.name,
                        level: 'warn',
                        message: `error calling '${plugins.constructor.name}.shouldRun(${testId})': ${Err.short(e)}`
                    };
                    LogManager.toConsole(logData);
                    return { result: true, message: logData.message };
                }
            }));
            const mgrResult: ProcessingResult<boolean> = {
                result: results.every(r => r.result === true),
                message: results.map(r => r.message).join('\n')
            }
            return mgrResult;
        }
        return { result: true };
    }

    private _getEnabledPlugins(): Array<PolicyEnginePlugin> {
        return this.plugins.filter(p => Err.handle(() => p?.enabled));
    }
}