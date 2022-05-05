import { PluginManager, IPluginManagerOptions } from "../plugin-manager";
import { ProcessingResult } from "../../helpers/processing-result";
import { LoggingPluginManager } from "../logging/logging-plugin-manager";
import { ITestCase } from "./itest-case";
import { AbstractTestCasePlugin, ITestCasePluginOptions } from "./abstract-test-case-plugin";

export interface ITestCasePluginManagerOptions extends ITestCasePluginOptions, IPluginManagerOptions {
    logMgr?: LoggingPluginManager;
}

/**
 * loads and provides an interface between any `ITestCasePlugin`
 * to specify a plugin use the following `aftconfig.json` key:
 * ```
 * {
 *   ...
 *   "testcasepluginmanager": {
 *     "pluginNames": ["plugin-name"]
 *   }
 *   ...
 * }
 * ```
 */
export class TestCasePluginManager extends PluginManager<AbstractTestCasePlugin, ITestCasePluginOptions> {
    readonly logMgr: LoggingPluginManager;

    constructor(options?: ITestCasePluginManagerOptions) {
        super(options);
        this.logMgr = options?.logMgr || new LoggingPluginManager({logName: this.optionsMgr.key});
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
            return await handler?.shouldRun(testId) || {success: true, message: `no ITestCasePlugin in use so run all tests`};
        }).catch(async (err) => {
            await this.logMgr.trace(err);
            return {success: true, message: `${err} - so run all tests`};
        });
    }
}

export module TestCasePluginManager {
    var _inst: TestCasePluginManager = null;
    export function instance(): TestCasePluginManager {
        if (_inst === null) {
            _inst = new TestCasePluginManager();
        }
        return _inst;
    }
}