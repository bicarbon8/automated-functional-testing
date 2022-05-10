import { PluginManager, PluginManagerOptions } from "../plugin-manager";
import { ProcessingResult } from "../../helpers/processing-result";
import { LogManager } from "../logging/log-manager";
import { ITestCase } from "./itest-case";
import { TestCasePlugin, TestCasePluginOptions } from "./test-case-plugin";

export interface TestCaseManagerOptions extends TestCasePluginOptions, PluginManagerOptions {
    logMgr?: LogManager;
}

/**
 * loads and provides an interface between any `ITestCasePlugin`
 * to specify a plugin use the following `aftconfig.json` key:
 * ```
 * {
 *   ...
 *   "testcasemanager": {
 *     "pluginNames": ["plugin-name"]
 *   }
 *   ...
 * }
 * ```
 */
export class TestCaseManager extends PluginManager<TestCasePlugin, TestCasePluginOptions> {
    readonly logMgr: LogManager;

    constructor(options?: TestCaseManagerOptions) {
        super(options);
        this.logMgr = options?.logMgr || new LogManager({logName: this.optionsMgr.key});
    }

    async getTestCase(testId: string): Promise<ITestCase> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.getTestCase(testId) || null;
        }).catch(async (err) => {
            await this.logMgr.trace(err);
            return null;
        });
    }

    async findTestCases(searchTerm: string): Promise<ITestCase[]> {
        return await this.getFirstEnabledPlugin()
        .then(async (plugin) => {
            return await plugin?.findTestCases(searchTerm) || [];
        }).catch(async (err) => {
            await this.logMgr.trace(err);
            return null;
        })
    }

    async shouldRun(testId: string): Promise<ProcessingResult> {
        return await this.getFirstEnabledPlugin()
        .then(async (handler) => {
            return await handler?.shouldRun(testId) || {success: true, message: `no TestCasePlugin in use so run all tests`};
        }).catch(async (err) => {
            await this.logMgr.trace(err);
            return {success: true, message: `${err} - so run all tests`};
        });
    }
}

export const testcases = new TestCaseManager();