import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { Reporter } from "../plugins/reporting/reporter";
import { TestExecutionPolicyManager } from "../plugins/test-execution-policy/test-execution-policy-manager";
import { Verifier } from "./verifier"

export type VerifierInternals = {
    usingAftConfig: (cfg: AftConfig) => Verifier, // eslint-disable-line no-unused-vars
    usingBuildInfoManager: (mgr: BuildInfoManager) => Verifier, // eslint-disable-line no-unused-vars
    usingReporter: (mgr: Reporter) => Verifier, // eslint-disable-line no-unused-vars
    usingTestExecutionPolicyManager: (mgr: TestExecutionPolicyManager) => Verifier // eslint-disable-line no-unused-vars
}
