import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { Reporter } from "../plugins/reporting/reporter";
import { TestExecutionPolicyManager } from "../plugins/test-execution-policy/test-execution-policy-manager";
import { Verifier } from "./verifier"

export type VerifierInternals = {
    usingAftConfig: (cfg: AftConfig) => Verifier,
    usingBuildInfoManager: (mgr: BuildInfoManager) => Verifier,
    usingReporter: (mgr: Reporter) => Verifier,
    usingTestExecutionPolicyManager: (mgr: TestExecutionPolicyManager) => Verifier
}
