import { Class, Err, Func, Verifier } from "aft-core";
import { WebDriver } from "selenium-webdriver";
import { UiComponentOptions, UiSessionGeneratorManager } from "aft-ui";
import { SeleniumVerifierInternals } from "./selenium-verifier-internals";
import { SeleniumComponent } from "../components/selenium-component";

export class SeleniumVerifier extends Verifier {
    protected override _assertion: Func<SeleniumVerifier, any>;
    protected _driver: unknown;
    protected _sessionMgr: UiSessionGeneratorManager;
    private _sessionOptions: Record<string, any> = {};

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

    override get internals(): SeleniumVerifierInternals {
        const baseInternals = super.internals as SeleniumVerifierInternals;
        baseInternals.usingUiSessionGeneratorManager = (mgr: UiSessionGeneratorManager) => {
            this._sessionMgr = mgr;
            return this;
        };
        return baseInternals;
    }

    /**
     * allows specifying additional session options to be merged with those
     * specified in your `aftconfig.json` file under the `UiSessionConfig.options`
     * property. for example, if your `aftconfig.json` already contained the 
     * following options:
     * ```json
     * // aftconfig.json
     * {
     *   "UiSessionConfig": {
     *     "generatorName": "foo-bar-baz",
     *     "options": {
     *       "bstack:options": {
     *         "user": "foo1234",
     *         "key": "klajsdflk1241234"
     *       }
     *     }
     *   }
     * }
     * ```
     * and you provided the following via `opts` here:
     * ```typescript
     * verifyWithSelenium(...).withAdditionalSessionOptions({
     *     "bstack:options": {
     *         "sessionName": "FooBarBaz"
     *     }
     * });
     * ```
     * your resulting options passed to the {UiSessionGeneratorManager} would
     * look like:
     * ```typescript
     * {
     *   "bstack:options": {
     *     "user": "foo1234",
     *     "key": "klajsdflk1241234",
     *     "sessionName": "FooBarBaz"
     *   }
     * }
     * ```
     * @param opts a {Record<string, any>} containing capabilities to be used
     * @returns a reference to {this}
     */
    withAdditionalSessionOptions(opts: Record<string, any>): this {
        this._sessionOptions = opts;
        return this;
    }

    getComponent<T extends SeleniumComponent>(componentType: Class<T>, opts?: UiComponentOptions): T {
        opts ??= {} as UiComponentOptions;
        opts.aftCfg ??= this.aftCfg;
        opts.driver ??= this.driver;
        opts.reporter ??= this.reporter;
        return new componentType(opts);
    }

    protected override async _resolveAssertion(): Promise<void> {
        this._driver = await this.sessionGeneratorManager.getSession(this._sessionOptions);
        try {
            await super._resolveAssertion();
        } finally {
            await Err.handleAsync(async () => await this.driver?.close());
            await Err.handleAsync(async () => await this.driver?.quit());
        }
    }
}

/**
 * creates a new `SeleniumVerifier` instace to be used for executing some Functional
 * Test Assertion.
 * ex:
 * ```
 * await verifyWithSelenium(async (v: SeleniumVerifier) => {
 *   let facet: MyFacet = await v.getComponent(MyFacet);
 *   return await facet.returnExpectedValue();
 * }).withDescription('example usage for SeleniumVerifier')
 * .and.withTestId('C1234')
 * .returns('expected value');
 * ```
 * @param assertion the {Func<SeleniumVerifier, any>} function to be executed by this `SeleniumVerifier`
 * @returns a new `SeleniumVerifier` instance
 */
export const verifyWithSelenium = (assertion: Func<SeleniumVerifier, any>): SeleniumVerifier => {
    return new SeleniumVerifier().verify(assertion);
}