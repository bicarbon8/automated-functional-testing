import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { TestExecutionPolicyManager } from "../plugins/test-execution-policy/test-execution-policy-manager";
import { Verifier } from "./verifier"

export type VerifierInternals = {
    /**
     * allows for using a specific {AftConfig} instance. if not
     * set then {aftConfig} global const is used
     * @param cfg a {AftConfig} instance
     * @returns this {Verifier} instance
     */
    usingAftConfig: (cfg: AftConfig) => Verifier; // eslint-disable-line no-unused-vars
    /**
     * allows for using a specific `BuildInfoManager` instance. if not
     * set then the global `BuildInfoManager.instance()` will be used
     * @param buildMgr a `BuildInfoManager` instance
     * @returns this `Verifier` instance
     */
    usingBuildInfoManager: (mgr: BuildInfoManager) => Verifier; // eslint-disable-line no-unused-vars
    /**
     * allows for using a specific `Reporter` instance. if not
     * set then one will be created for use by this `Verifier`
     * @param reporter a `Reporter` instance
     * @returns this `Verifier` instance
     */
    usingReporter: (mgr: Reporter) => Verifier; // eslint-disable-line no-unused-vars
    /**
     * allows for using a specific `TestExecutionPolicyManager` instance. if not
     * set then the global `TestExecutionPolicyManager.instance()` will be used
     * @param policyMgr a `TestExecutionPolicyManager` instance
     * @returns this `Verifier` instance
     */
    usingTestExecutionPolicyManager: (mgr: TestExecutionPolicyManager) => Verifier; // eslint-disable-line no-unused-vars
    /**
     * enables results caching which can be used to prevent sending the same result multiple times
     * when using an external test framework reporter plugin
     * @returns this `Verifier` instance
     */
    withResultsCaching: () => Verifier;
    /**
     * disables results caching if previously enabled
     * @returns this `Verifier` instance
     */
    withoutResultsCaching: () => Verifier;
    /**
     * searches the filesystem cache for any logged test results for a named
     * test and returns the results as an array of `TestResult` objects with
     * each object corresponding to a Test ID referenced in the test name
     * @param fullName the full test name under which the results are cached
     * @returns an array of `TestResult` objects for the named test where each
     * entry corresponds to a referenced Test ID parsed from the `fullName`
     */
    getCachedResults: (fullName: string) => Array<TestResult>; // eslint-disable-line no-unused-vars
}
