import { cloneDeep } from "lodash";
import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { Err } from "../../helpers/err";
import { pluginLoader } from "../plugin-loader";
import { ResultsPlugin } from "./results-plugin";
import { TestResult } from "./test-result";
import { LogManager } from "../logging/log-manager";

export class ResultsManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<ResultsPlugin>;
    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
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
                LogManager.toConsole({
                    level: 'warn',
                    message: `unable to send result to '${plugin?.constructor.name || 'unknown'}' due to: ${Err.short(e)}`,
                    name: result?.testName ?? this.constructor.name
                });
            }
        }
    }
}