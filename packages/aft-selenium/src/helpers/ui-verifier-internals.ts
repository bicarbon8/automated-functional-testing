import { Merge, VerifierInternals } from "aft-core";
import { UiSessionGeneratorManager } from "../sessions/ui-session-generator-manager";
import { Verifier } from "aft-core";

export type UiVerifierInternals = Merge<VerifierInternals, {
    usingUiSessionGeneratorManager: (mgr: UiSessionGeneratorManager) => Verifier
}>;