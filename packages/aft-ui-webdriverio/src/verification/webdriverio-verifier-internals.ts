import { Merge, Verifier, VerifierInternals } from "aft-core";
import { UiSessionGeneratorManager } from "aft-ui";

export type WebdriverIoVerifierInternals = Merge<VerifierInternals, {
    /**
     * allows for setting a specific {UiSessionGeneratorManage} instance to be
     * used to generate a new UI session. if not set a new instance will be created
     * and used instead
     * @param mgr the {UiSessionGeneratorManager} instance to use
     * @returns this {Verifier} instance
     */
    usingUiSessionGeneratorManager: (mgr: UiSessionGeneratorManager) => Verifier
}>;