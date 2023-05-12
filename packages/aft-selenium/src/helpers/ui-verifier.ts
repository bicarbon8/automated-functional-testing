import { Func, Verifier } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { UiSessionGeneratorManager } from "../sessions/ui-session-generator-manager";
import { UiVerifierInternals } from "./ui-verifier-internals";

export class UiVerifier extends Verifier {
    protected override _assertion: Func<UiVerifier, any>;
    protected _driver: WebDriver;
    protected _sessionMgr: UiSessionGeneratorManager;

    /**
     * a {UiSessionGeneratorManager} instance used to generate new
     * Browser sessions
     */
    get sessionGeneratorManager(): UiSessionGeneratorManager {
        if (!this._sessionMgr) {
            this._sessionMgr = new UiSessionGeneratorManager(this.aftCfg);
        }
        return this._sessionMgr;
    }

    /**
     * after a new {WebDriver} is created, this holds the instance
     * so it can be referenced from within the executing `assertion`
     */
    get driver(): WebDriver {
        return this._driver;
    }

    override get internals(): UiVerifierInternals {
        const baseInternals = super.internals as UiVerifierInternals;
        baseInternals['usingUiSessionGeneratorManager'] = (mgr: UiSessionGeneratorManager) => {
            this._sessionMgr = mgr;
            return this;
        };
        return baseInternals;
    }

    protected override async _resolveAssertion(): Promise<void> {
        this._driver = await this.sessionGeneratorManager.getSession(this._logMgr.logName, this.aftCfg);
        try {
            await super._resolveAssertion();
        } finally {
            await this._driver.close();
        }
    }
}

/**
 * creates a new `BrowserVerifier` instace to be used for executing some Functional
 * Test Assertion.
 * ex:
 * ```
 * await verifyWithBrowser(async (v: BrowserVerifier) => {
 *   let facet: MyFacet = await v.session.getFacet(MyFacet);
 *   return await facet.returnExpectedValue();
 * }).withDescription('example usage for BrowserVerifier')
 * .and.withTestId('C1234')
 * .returns('expected value');
 * ```
 * @param assertion the {Func<BrowserVerifier, any>} function to be executed by this `BrowserVerifier`
 * @returns a new `BrowserVerifier` instance
 */
export const verifyWithBrowser = (assertion: Func<UiVerifier, any>): UiVerifier => {
    return new UiVerifier().verify(assertion);
}