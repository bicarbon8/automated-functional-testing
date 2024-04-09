import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { Reporter } from "../plugins/reporting/reporter";
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
     * allows for setting one or more `testId` to be checked before executing the `assertion`
     * and to be reported to from any connected logging plugins that connect to
     * your test case management system. if all the referenced `testId` values should not be
     * run (as returned by your `PolicyPlugin.shouldRun(testId)`) then
     * the `assertion` will not be run. this is typically not needed since setting a
     * `Verifier.description` will automatically parse any test IDs from the description.
     * 
     * ex:
     * a `Verifier.description` of:
     * `some test [C1234] description to be [C2345] run`
     * would result in test IDs of: `"C1234"` and `"C2345"` being automatically set
     * 
     * **NOTE:**
     * > multiple `testId` values can be specified and will clear any previously set test IDs
     * @param testIds a test identifier for your connected `PolicyPlugin`
     * @returns this `Verifier` instance
     */
    withTestIds: (...testIds: Array<string>) => Verifier; // eslint-disable-line no-unused-vars
}
