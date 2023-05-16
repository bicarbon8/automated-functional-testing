import { cloneDeep } from "lodash";
import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { Err } from "../../helpers/err";
import { pluginLoader } from "../plugin-loader";
import { ResultsPlugin } from "./results-plugin";
import { TestResult } from "./test-result";
import { AftLogger, aftLogger } from "../../helpers/aft-logger";

export class ResultsManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<ResultsPlugin>;
    private readonly _aftLogger: AftLogger;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this._aftLogger = (aftCfg) ? new AftLogger(aftCfg) : aftLogger;
        this.plugins = pluginLoader.getPluginsByType(ResultsPlugin, this.aftCfg);
    }

    /**
     * function will send the passed in `TestResult` to any loaded `IResultsPlugin` implementations
     * allowing them to process the result
     * @param result a `TestResult` object to be sent
     */
    async submitResult(result: TestResult): Promise<void> {
        for (var plugin of this.plugins.filter(p => Err.handle(() => p?.enabled))) {
            try {
                await plugin?.submitResult(cloneDeep(result));
            } catch (e) { 
                this._aftLogger.log({
                    level: 'warn',
                    message: `unable to send result to '${plugin?.constructor.name || 'unknown'}' due to: ${Err.short(e)}`,
                    name: result?.testName ?? this.constructor.name
                });
            }
        }
    }
}