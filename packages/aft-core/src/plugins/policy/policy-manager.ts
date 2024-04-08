import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { AftLogger } from "../../logging/aft-logger";
import { ProcessingResult } from "../../helpers/custom-types";
import { Err } from "../../helpers/err";
import { pluginLoader } from "../plugin-loader";
import { PolicyPlugin } from "./policy-plugin";
import { LogMessageData } from "../../logging/log-message-data";

export class PolicyManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<PolicyPlugin>;

    private readonly _aftLogger: AftLogger;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this._aftLogger = new AftLogger(this.constructor.name, aftCfg);
        this.plugins = pluginLoader.getEnabledPluginsByType(PolicyPlugin, this.aftCfg);
    }

    /**
     * iterates over all enabled `IPolicyPlugin` implementations calling `shouldRun`
     * and if any of the results return `false` then a `ShouldRunResult` containing `false`
     * and a reason comprised of all plugin reasons will be returned, otherwise `true`
     * @param testId the test case id to check
     * @returns a `ShouldRunResult` containing `shouldRun=true` if test should be run
     * otherwise `false` and a `reason` stating why
     */
    async shouldRun(testId: string): Promise<ProcessingResult<boolean>> {
        if (this.plugins?.length > 0) {
            const results = await Promise.all(this.plugins.map(async p => {
                try {
                    return await p.shouldRun(testId);
                } catch (e) {
                    const logData: LogMessageData = {
                        level: 'warn',
                        message: `error calling '${p?.constructor.name || 'unknown'}.shouldRun(${testId})': ${Err.short(e)}`
                    };
                    this._aftLogger.log(logData);
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
}