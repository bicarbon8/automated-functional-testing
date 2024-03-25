import { Class, Err, Func, Verifier } from "aft-core";
import { UiComponentOptions, UiSessionGeneratorManager } from "aft-ui";
import { WebdriverIoVerifierInternals } from "./webdriverio-verifier-internals";
import { WebdriverIoComponent } from "../components/webdriverio-component";

export class WebdriverIoVerifier extends Verifier {
    protected override _assertion: Func<WebdriverIoVerifier, any>;
    protected _sessionMgr: UiSessionGeneratorManager;
    protected _browser: unknown;
    protected _sessionOptions: Record<string, any>;

    /**
     * a `UiSessionGeneratorManager` instance used to generate new
     * UI Sessions from
     */
    get sessionGeneratorManager(): UiSessionGeneratorManager {
        if (!this._sessionMgr) {
            this._sessionMgr = new UiSessionGeneratorManager(this.aftCfg);
        }
        return this._sessionMgr;
    }

    /**
     * after a new `Browser` session is created, this holds the instance
     * so it can be referenced from within the executing `assertion`
     */
    get browser(): WebdriverIO.Browser {
        return this._browser as WebdriverIO.Browser;
    }

    override get internals(): WebdriverIoVerifierInternals {
        const baseInternals = super.internals as WebdriverIoVerifierInternals;
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
     * verifyWithWebdriverIO(...).withAdditionalSessionOptions({
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

    getComponent<T extends WebdriverIoComponent>(componentType: Class<T>, opts?: UiComponentOptions): T {
        opts ??= {} as UiComponentOptions;
        opts.aftCfg ??= this.aftCfg;
        opts.driver ??= this.browser;
        opts.reporter ??= this.reporter;
        return new componentType(opts);
    }

    protected override async _resolveAssertion(): Promise<void> {
        this._browser = await this.sessionGeneratorManager.getSession(this._sessionOptions);
        try {
            await super._resolveAssertion();
        } finally {
            Err.handleAsync(async () => await this.browser.deleteSession());
        }
    }
}

/**
 * creates a new `WebdriverIoVerifier` instace to be used for executing some Functional
 * Test Assertion.
 * ex:
 * ```
 * await verifyWithWebdriverIO(async (v: WebdriverIoVerifier) => {
 *   let compo: MyComponent = await v.getComponent(MyComponent);
 *   return await compo.returnExpectedValue();
 * }).withDescription('example usage for WebdriverIoVerifier')
 * .and.withTestId('C1234')
 * .returns('expected value');
 * ```
 * @param assertion the `Func<WebdriverIoVerifier, any>` function to be executed by this `WebdriverIoVerifier`
 * @returns a new `WebdriverIoVerifier` instance
 */
export const verifyWithWebdriverIO = (assertion: Func<WebdriverIoVerifier, any>): WebdriverIoVerifier => {
    let v: WebdriverIoVerifier = new WebdriverIoVerifier();
    v.verify(assertion);
    return v;
}