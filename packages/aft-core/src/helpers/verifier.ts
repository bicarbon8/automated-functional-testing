import { LogManager } from "../plugins/logging/log-manager";
import { TestResult } from "../plugins/results/test-result";
import { PolicyEngineManager } from "../plugins/policy-engine/policy-engine-manager";
import { TestStatus } from "../plugins/results/test-status";
import { convert } from "./convert";
import { Func, ProcessingResult } from "./custom-types";
import { rand } from "./rand";
import { equaling, VerifierMatcher } from "./verifier-matcher";
import { Err } from "./err";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager";
import { AftConfig, aftConfig } from "../configuration/aft-config";
import { ResultsManager } from "../plugins/results/results-manager";

/**
 * class to be used for executing some Functional Test Assertion after checking with any
 * `TestCasePlugin` and `DefectPlugin` instances that have been loaded to confirm that the
 * assertion should be executed based on referenced Test ID(s) or Defect ID(s)
 * 
 * Ex:
 * ```
 * await verify(async (v: Verifier) => {
 *   await v.logMgr.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if TestCasePlugin.shouldRun('C1234') returns `false` the assertion is not run
 * .and.withKnownDefectIds('AUTO-123') // if DefectPlugin.getDefect('AUTO-123').status === 'open' the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export class Verifier implements PromiseLike<void> {
    public readonly aftCfg: AftConfig;

    protected _assertion: Func<Verifier, any>;
    protected _matcher: VerifierMatcher;
    protected _description: string;
    protected _startTime: number;
    protected _innerPromise: Promise<void>;
    protected _testIds: Set<string>;
    protected _logMgr: LogManager;
    protected _policyEngMgr: PolicyEngineManager;
    protected _buildInfoMgr: BuildInfoManager;
    protected _resMgr: ResultsManager;

    constructor(aftCfg?: AftConfig) {
        this.aftCfg = aftCfg ?? aftConfig;

        this._startTime = new Date().getTime();
        this._testIds = new Set<string>();
    }
    
    /**
     * a `LogManager` that uses either the Description
     * or a list of Test Ids or a `uuid` as the `logName` depending
     * on which is available (NOTE: description is preferred most and
     * will be used if other values are also present)
     */
    get logMgr(): LogManager {
        let logName: string;
        if (this._description) {
            logName = this._description;
        } else if (this._testIds.size > 0) {
            logName = Array.from(this._testIds).join('_');
        } else {
            logName = this.constructor.name;
        }
        if (!this._logMgr) {
            this._logMgr = new LogManager(logName, this.aftCfg);
        }
        return this._logMgr;
    }

    get policyEng(): PolicyEngineManager {
        if (!this._policyEngMgr) {
            this._policyEngMgr = new PolicyEngineManager(this.aftCfg);
        }
        return this._policyEngMgr;
    }

    get buildInfo(): BuildInfoManager {
        if (!this._buildInfoMgr) {
            this._buildInfoMgr = new BuildInfoManager(this.aftCfg);
        }
        return this._buildInfoMgr;
    }

    get resultsMgr(): ResultsManager {
        if (!this._resMgr) {
            this._resMgr = new ResultsManager(this.aftCfg);
        }
        return this._resMgr;
    }

    async then<TResult1 = Verifier, TResult2 = never>(onfulfilled?: (value: void) => TResult1 | PromiseLike<TResult1>, onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>): Promise<TResult1 | TResult2> {
        return this._getInnerPromise()
        .then(onfulfilled, onrejected);
    }

    protected async _getInnerPromise(): Promise<void> {
        if (!this._innerPromise) {
            this._innerPromise = new Promise(async (resolve, reject) => {
                try {
                    const shouldRun = await this._shouldRunTests(...Array.from(this._testIds));
                    if (shouldRun.result === true) {
                        await this._resolveAssertion();
                        await this._logResult('passed');
                    } else {
                        await this._logResult('skipped', shouldRun.message);
                    }
                    resolve();
                } catch(e) {
                    await this._logResult('failed', e);
                    reject(e);
                }
            });
        }
        return this._innerPromise;
    }

    protected async _resolveAssertion(): Promise<void> {
        let result: any = await Promise.resolve(this._assertion(this));
        if (this._matcher !== undefined) {
            if (!this._matcher.setActual(result).compare()) {
                return Promise.reject(`${this._matcher.failureString()}`);
            }
        }
    }

    /**
     * a syntactic way of connecting fluent functions for the Verifier
     */
    get and(): this {
        return this;
    }

    /**
     * the starting point for setting up a `Verifier` execution. Generally it is preferred
     * to use the `verify(...)` `const` instead of creating individual `Verifier` instances.
     * ex:
     * ```
     * await verify(async (v: Verifier) => {
     *   await v.logMgr.info('doing some testing...');
     *   let feature = new FeatureObj();
     *   return await feature.returnExpectedValue();
     * }).withDescription('example usage for Verifier')
     * .and.withTestId('C1234')
     * .returns('expected value');
     * ```
     * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
     * @returns this `Verifier` instance
     */
    verify(assertion: Func<Verifier, any>): this {
        this._assertion = assertion;
        return this;
    }

    /**
     * allows for setting the `description` to be used as the `logName` in any
     * logging output from this `Verifier`
     * @param description the description of this `Verifier`
     * @returns this `Verifier` instance
     */
    withDescription(description: string): this {
        this._description = description;
        return this;
    }

    /**
     * allows for setting a `testId` to be checked before executing the `assertion`
     * and to be reported to from any connected logging plugins that connect to
     * your test case management system. if all the referenced `testId` values should not be
     * run (as returned by your `AbstractTestCasePlugin.shouldRun(testId)`) then
     * the `assertion` will not be run.
     * NOTE: multiple `testId` values can be chained together
     * @param testIds a test identifier for your connected `AbstractTestCasePlugin`
     * @returns this `Verifier` instance
     */
    withTestIds(...testIds: string[]): this {
        if (testIds?.length) {
            for (var i=0; i<testIds.length; i++) {
                this._testIds.add(testIds[i]);
            }
        }
        return this;
    }

    /**
     * allows for specifying either the expected return value or a `VerifierMatcher`
     * to be used to compare the return value using the `VerifierMatcher.compare()`
     * function. if not set then only exceptions will cause a `failed` result on
     * the executed `assertion`
     * @param result the expected result or a `VerifierMatcher` implementation
     * @returns this `Verifier` instance
     */
    returns(result: any | VerifierMatcher): this {
        if (result['compare'] && result['setActual'] && result['failureString']) {
            this._matcher = result;
        } else {
            this._matcher = equaling(result);
        }
        return this;
    }

    /**
     * allows for using a specific `LogManager` instance. if not
     * set then one will be created for use by this `Verifier`
     * @param logMgr a `LogManager` instance
     * @returns this `Verifier` instance
     */
    withLogManager(logMgr: LogManager): this {
        this._logMgr = logMgr;
        return this;
    }

    /**
     * allows for using a specific `PolicyEngineManager` instance. if not
     * set then the global `PolicyEngineManager.instance()` will be used
     * @param policyMgr a `PolicyEngineManager` instance
     * @returns this `Verifier` instance
     */
    withPolicyEngineManager(policyMgr: PolicyEngineManager): this {
        this._policyEngMgr = policyMgr;
        return this;
    }

    /**
     * allows for using a specific `BuildInfoManager` instance. if not
     * set then the global `BuildInfoManager.instance()` will be used
     * @param buildMgr a `BuildInfoManager` instance
     * @returns this `Verifier` instance
     */
    withAftBuildInfo(buildMgr: BuildInfoManager): this {
        this._buildInfoMgr = buildMgr;
        return this;
    }

    /**
     * allows for using a specific `ResultsManager` instance. if not
     * set then the global `ResultsManager.instance()` will be used
     * @param refMgr a `ResultsManager` instance
     * @returns this `Verifier` instance
     */
    withResultsManager(refMgr: ResultsManager): this {
        this._resMgr = refMgr;
        return this;
    }

    /**
     * checks if any of the supplied test ids should be run and returns `true` if at least
     * one of them should
     * @param testIds iterates over all test ids checking the `PolicyEngineManager` to see
     * if any should be run and returns `true` if any should be run, otherwise `false`
     * @returns a `ProcessingResult<boolean>` indicating if the testing should proceed
     */
    protected async _shouldRunTests(...testIds: string[]): Promise<ProcessingResult<boolean>> {
        const shouldRunTests = new Array<string>();
        const shouldNotRunTests = new Array<string>();
        if (testIds?.length) {
            for (var i=0; i<testIds.length; i++) {
                let testId: string = testIds[i];
                let result: ProcessingResult<boolean> = await this.policyEng.shouldRun(testId);
                if (result.result === true) {
                    shouldRunTests.push(testId);
                } else {
                    shouldNotRunTests.push(testId);
                }
            }
            if (shouldRunTests.length === 0) {
                return {result: false, message: `none of the supplied tests should be run: [${testIds.join(', ')}]`};
            }
            return {result: true, message: `the following supplied tests should be run: [${shouldRunTests.join(', ')}]`};
        } else if (this.policyEng.plugins?.filter(p => Err.handle(() => p?.enabled)).length > 0) {
            return {result: false, message: `no associated testIds found for test, but enabled 'IPolicyEnginePlugins' exist so test should not be run`}
        }
        return {result: true};
    }

    /**
     * creates `TestResult` objects for each `testId` and sends these
     * to the `LogManager.logResult` function
     */
    protected async _logResult(status: TestStatus, message?: string): Promise<void> {
        try {
            status ??= 'untested';
            if (this._testIds.size) {
                this._testIds.forEach(async (testId: string) => {
                    if (message) {
                        await this._logMessage(status, `${testId} - ${message}`);
                    } else {
                        await this._logMessage(status, testId);
                    }
                });
            } else {
                await this._logMessage(status, message);
            }

            let results: TestResult[] = await this._generateTestResults(status, message, ...Array.from(this._testIds.values()));
            for (var i=0; i<results.length; i++) {
                let result: TestResult = results[i];
                try {
                    await this.resultsMgr.submitResult(result);
                } catch (e) {
                    await this.logMgr.warn(`unable to log test result for test '${result.testId || result.resultId}' due to: ${Err.short(e)}`);
                }
            }
        } finally {
            await this.logMgr.dispose();
        }
    }

    protected async _logMessage(status: TestStatus, message?: string): Promise<void> {
        message = message || this.logMgr.logName;
        switch (status) {
            case 'blocked':
            case 'retest':
            case 'skipped':
            case 'untested':
                await this.logMgr.warn(message);
                break;
            case 'failed':
                await this.logMgr.fail(message);
                break;
            case 'passed':
            default:
                await this.logMgr.pass(message);
                break;
        }
    }

    protected async _generateTestResults(status: TestStatus, logMessage: string, ...testIds: string[]): Promise<TestResult[]> {
        let results: TestResult[] = [];
        if (testIds.length > 0) {
            for (var i=0; i<testIds.length; i++) {
                let testId: string = testIds[i];
                let result: TestResult = await this._generateTestResult(status, logMessage, testId);
                results.push(result);
            }
        } else {
            let result: TestResult = await this._generateTestResult(status, logMessage);
            results.push(result);
        }
        return results;
    }

    protected async _generateTestResult(status: TestStatus, logMessage: string, testId?: string): Promise<TestResult> {
        let result: TestResult = {
            testId: testId,
            created: Date.now(),
            resultId: rand.guid,
            resultMessage: logMessage,
            status: status,
            metadata: {
                durationMs: convert.toElapsedMs(this._startTime),
                buildName: await this.buildInfo.buildName() || 'unknown',
                buildNumber: await this.buildInfo.buildNumber() || 'unknown'
            }
        };
        return result;
    }
}

/**
 * creates a new `Verifier` instace to be used for executing some Functional
 * Test Assertion.
 * 
 * Ex:
 * ```typescript
 * await verify(async (v: Verifier) => {
 *   await v.logMgr.info('doing some testing...');
 *   let feature = new FeatureObj();
 *   return await feature.returnExpectedValue();
 * }).withDescription('example usage for Verifier')
 * .and.withTestIds('C1234') // if PolicyEngineManager.shouldRun('C1234') returns `false` the assertion is not run
 * .returns('expected value');
 * ```
 * @param assertion the `Func<Verifier, any>` function to be executed by this `Verifier`
 * @returns a new `Verifier` instance
 */
export const verify = (assertion: Func<Verifier, any>): Verifier => {
    return new Verifier().verify(assertion);
};