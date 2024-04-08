import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { Reporter } from "../plugins/reporting/reporter";
import { TestResult } from "../plugins/reporting/test-result";
import { PolicyManager } from "../plugins/policy/policy-manager";
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
     * allows for using a specific `PolicyManager` instance. if not
     * set then the global `PolicyManager.instance()` will be used
     * @param policyMgr a `PolicyManager` instance
     * @returns this `Verifier` instance
     */
    usingPolicyManager: (mgr: PolicyManager) => Verifier; // eslint-disable-line no-unused-vars
    /**
     * enables results caching to store results on the file system which can be used
     * to prevent sending the same result multiple times when using an external test
     * framework reporter plugin
     * @returns this `Verifier` instance
     */
    withFileSystemCache: () => Verifier;
    /**
     * disables file system results caching if previously enabled
     * @returns this `Verifier` instance
     */
    withoutFileSystemCache: () => Verifier;
    /**
     * returns an array of `TestResult` objects for each result already submitted.
     * if `withFilesystemCache` is enabled this includes searching the filesystem
     * cache for any logged test results for a named test and returning the
     * results as an array of `TestResult` objects with each object corresponding
     * to a Test ID referenced in the test name
     * @returns an array of `TestResult` objects for the named test where each
     * entry corresponds to a referenced Test ID parsed from the `fullName`
     */
    getCachedResults: () => Array<TestResult>; // eslint-disable-line no-unused-vars
}
