import { LogManager } from "../logging/log-manager";
import { TestCase } from "./test-case";
import { TestCasePlugin } from "./test-case-plugin";
import { PluginManagerWithLogging, PluginManagerWithLoggingOptions } from "../plugin-manager-with-logging";

export type TestCaseManagerOptions = PluginManagerWithLoggingOptions;

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
export class TestCaseManager extends PluginManagerWithLogging<TestCasePlugin<any>, TestCaseManagerOptions> {
    async getTestCase(testId: string): Promise<TestCase> {
        let testcase: TestCase = await this.first()
        .then((p: TestCasePlugin<any>) => p?.getTestCase(testId)
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling '${p?.constructor.name || 'unknown'}.getTestCase(${testId}) due to: ${err}`));
                return null;
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return null;
        });
        return testcase;
    }

    async findTestCases(searchTerm: string): Promise<TestCase[]> {
        let testcases: TestCase[] = await this.first()
        .then((p: TestCasePlugin<any>) => p?.findTestCases(searchTerm)
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling '${p?.constructor.name || 'unknown'}.findTestCases(${searchTerm}) due to: ${err}`));
                return [];
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return [];
        });
        return testcases || [];
    }

    async shouldRun(testId: string): Promise<boolean> {
        let shouldrun: boolean = await this.first()
        .then((p: TestCasePlugin<any>) => p?.shouldRun(testId)
            .catch(async (err) => {
                await this.logMgr()
                .then((l: LogManager) => l.warn(`error calling '${p?.constructor.name || 'unknown'}.shouldRun(${testId}) due to: ${err}`));
                return false;
            }))
        .catch(async (err) => {
            await this.logMgr()
            .then((l: LogManager) => l.warn(err));
            return false;
        });
        return shouldrun || true;
    }
}

export const testcases = new TestCaseManager();