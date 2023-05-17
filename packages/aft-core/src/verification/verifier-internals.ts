import { AftConfig } from "../configuration/aft-config";
import { BuildInfoManager } from "../plugins/build-info/build-info-manager"
import { LogManager } from "../plugins/logging/log-manager";
import { PolicyEngineManager } from "../plugins/policy-engine/policy-engine-manager";
import { ResultsManager } from "../plugins/results/results-manager";
import { Verifier } from "./verifier"

export type VerifierInternals = {
    usingAftConfig: (cfg: AftConfig) => Verifier,
    usingBuildInfoManager: (mgr: BuildInfoManager) => Verifier,
    usingLogManager: (mgr: LogManager) => Verifier,
    usingPolicyEngineManager: (mgr: PolicyEngineManager) => Verifier,
    usingResultsManager: (mgr: ResultsManager) => Verifier,
}