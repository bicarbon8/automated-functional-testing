import { Func, using, Verifier } from "aft-core";
import { BrowserSession, BrowserSessionOptions } from "../sessions/browser-session";
import { BrowserSessionGeneratorPluginManager } from "../sessions/browser-session-generator-plugin-manager";

export class BrowserVerifier extends Verifier {
    protected _assertion: Func<BrowserVerifier, any>;
    protected _sessionMgr: BrowserSessionGeneratorPluginManager;
    protected _session: BrowserSession;
    protected _sessionOptions: BrowserSessionOptions;

    /**
     * a {BrowserSessionGeneratorPluginManager} instance used to generate new
     * Browser sessions
     */
    get sessionGeneratorPluginManager(): BrowserSessionGeneratorPluginManager {
        if (!this._sessionMgr) {
            this._sessionMgr = BrowserSessionGeneratorPluginManager.instance();
        }
        return this._sessionMgr;
    }

    /**
     * after a new {BrowserSession} is created, this holds the instance
     * so it can be referenced from within the executing `assertion`
     */
    get session(): BrowserSession {
        return this._session;
    }

    /**
     * the {BrowserSessionOptions} that will be used when creating a 
     * new {BrowserSession}
     */
    get sessionOptions(): BrowserSessionOptions {
        if (!this._sessionOptions) {
            this._sessionOptions = {logMgr: this.logMgr};
        }
        return this._sessionOptions;
    }

    /**
     * allows for specifying custom {BrowserSessionOptions} to be used when creating
     * a new {BrowserSession} prior to executing the `assertion`.
     * NOTE: if not set then only the {BrowserVerifier.logMgr} will be included in
     * the {BrowserSessionOptions}
     * @param options the {BrowserSessionOptions} to be used to create a new {BrowserSession}
     * @returns this {BrowserVerifier} instance
     */
    withBrowserSessionOptions(options: BrowserSessionOptions): this {
        this._sessionOptions = options;
        return this;
    }

    /**
     * allows for passing in an instance of {BrowserSessionGeneratorPluginManager} to be
     * used in locating a {AbstractBrowserSessionGeneratorPlugin} instance to use in 
     * generating a {BrowserSession}.
     * NOTE: if not set then the global {BrowserSessionGeneratorPluginManager.instance()}
     * will be used
     * @param sessionMgr a {BrowserSessionGeneratorPluginManager} to be used instead of the Global instance
     * @returns this {BrowserVerifier} instance
     */
    withBrowserSessionGeneratorPluginManager(sessionMgr: BrowserSessionGeneratorPluginManager): this {
        this._sessionMgr = sessionMgr;
        return this;
    }

    protected async _resolveAssertion(): Promise<void> {
        let opts: BrowserSessionOptions = this.sessionOptions;
        opts.logMgr = opts.logMgr || this.logMgr;
        await using(await this.sessionGeneratorPluginManager.newSession(opts), async (session) => {
            this._session = session;
            await super._resolveAssertion();
        });
    }
}

/**
 * creates a new {BrowserVerifier} instace to be used for executing some Functional
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
 * @param assertion the {Func<BrowserVerifier, any>} function to be executed by this {BrowserVerifier}
 * @returns a new {BrowserVerifier} instance
 */
export const verifyWithBrowser = (assertion: Func<BrowserVerifier, any>): BrowserVerifier => {
    let v: BrowserVerifier = new BrowserVerifier();
    v.verify(assertion);
    return v;
}