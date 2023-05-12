import { Class, Err, Func, Verifier } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { UiComponentOptions, UiPlatform, UiSessionConfig, UiSessionGeneratorManager } from "aft-ui";
import { BrowserVerifierInternals } from "./browser-verifier-internals";
import { BrowserComponent } from "../components/browser-component";

export class BrowserVerifier extends Verifier {
    protected override _assertion: Func<BrowserVerifier, any>;
    protected _driver: unknown;
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
     * after a new driver instance is created, this holds the instance
     * so it can be referenced from within the executing `assertion`
     */
    get driver(): WebDriver {
        return this._driver as WebDriver;
    }

    /**
     * returns a {UiPlatform} from the value set in your {UiSessionConfig}
     * in `aftconfig.json` or the provided {AftConfig} instance
     */
    get uiPlatform(): UiPlatform {
        return this.aftCfg.getSection(UiSessionConfig).uiplatform;
    }

    override get internals(): BrowserVerifierInternals {
        const baseInternals = super.internals as BrowserVerifierInternals;
        baseInternals.usingUiSessionGeneratorManager = (mgr: UiSessionGeneratorManager) => {
            this._sessionMgr = mgr;
            return this;
        };
        return baseInternals;
    }

    getComponent<T extends BrowserComponent>(componentType: Class<T>, opts?: UiComponentOptions): T {
        opts ??= {} as UiComponentOptions;
        opts.aftCfg ??= this.aftCfg;
        opts.driver ??= this.driver;
        opts.logMgr ??= this.logMgr;
        return new componentType(opts);
    }

    protected override async _resolveAssertion(): Promise<void> {
        this._driver = await this.sessionGeneratorManager.getSession(this._logMgr.logName, this.aftCfg);
        try {
            await super._resolveAssertion();
        } finally {
            Err.handleAsync(async () => await this.driver?.close());
            Err.handleAsync(async () => await this.driver?.quit());
        }
    }
}

/**
 * creates a new `BrowserVerifier` instace to be used for executing some Functional
 * Test Assertion.
 * ex:
 * ```
 * await verifyWithBrowser(async (v: BrowserVerifier) => {
 *   let facet: MyFacet = await v.getComponent(MyFacet);
 *   return await facet.returnExpectedValue();
 * }).withDescription('example usage for BrowserVerifier')
 * .and.withTestId('C1234')
 * .returns('expected value');
 * ```
 * @param assertion the {Func<BrowserVerifier, any>} function to be executed by this `BrowserVerifier`
 * @returns a new `BrowserVerifier` instance
 */
export const verifyWithBrowser = (assertion: Func<BrowserVerifier, any>): BrowserVerifier => {
    return new BrowserVerifier().verify(assertion);
}