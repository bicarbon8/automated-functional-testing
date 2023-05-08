import { AftConfig, aftConfig } from "../../configuration/aft-config";
import { Err } from "../../helpers/err";
import { AftLog } from "../logging/aft-log";
import { pluginLoader } from "../plugin-loader";
import { ITestCasePlugin } from "./i-test-case-plugin";
import { TestCase } from "./test-case";

export class TestCaseManager {
    public readonly aftCfg: AftConfig;
    public readonly plugins: Array<ITestCasePlugin>;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;
        this.plugins = pluginLoader.getPluginsByType<ITestCasePlugin>('testcase');
    }

    async getTestCase(testId: string): Promise<TestCase> {
        const plugin = this._getFirstEnabledPlugin();
        if (plugin) {
            try {
                return await plugin.getTestCase(testId);
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.getTestCase(${testId})': ${Err.short(e)}`
                });
            }
        }
        return null;
    }

    async findTestCases(searchCriteria: Partial<TestCase>): Promise<TestCase[]> {
        const plugin = this._getFirstEnabledPlugin();
        if (plugin) {
            try {
                return await plugin.findTestCases(searchCriteria);
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.findTestCases(${JSON.stringify(searchCriteria)})': ${Err.short(e)}`
                });
            }
        }
        return new Array<TestCase>();
    }

    async shouldRun(testId: string): Promise<boolean> {
        const plugin = this._getFirstEnabledPlugin();
        if (plugin) {
            try {
                return await plugin.shouldRun(testId);
            } catch (e) {
                AftLog.toConsole({
                    name: this.constructor.name,
                    logLevel: 'warn',
                    message: `error calling '${plugin.constructor.name}.shouldRun(${testId})': ${Err.short(e)}`
                });
            }
        }
        return true;
    }

    private _getFirstEnabledPlugin(): ITestCasePlugin {
        return this.plugins.find(p => Err.handle(() => p?.enabled));
    }
}