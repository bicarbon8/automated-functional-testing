import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { LogManager } from "../plugins/logging/log-manager";
import { PolicyEngineManager } from "../plugins/policy-engine/policy-engine-manager";
import { ResultsManager } from "../plugins/results/results-manager";
import { Verifier } from "./verifier"

export type VerifierInternals = {
    usingBuildInfoManager: (mgr: BuildInfoManager) => Verifier,
    usingLogManager: (mgr: LogManager) => Verifier,
    usingPolicyEngineManager: (mgr: PolicyEngineManager) => Verifier,
    usingResultsManager: (mgr: ResultsManager) => Verifier,
}