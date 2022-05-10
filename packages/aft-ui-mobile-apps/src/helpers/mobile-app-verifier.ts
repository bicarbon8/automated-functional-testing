import { Func, using, Verifier } from "aft-core";
import { MobileAppSession, MobileAppSessionOptions } from "../sessions/mobile-app-session";
import { mobileAppSessionGeneratorMgr, MobileAppSessionGeneratorManager } from "../sessions/mobile-app-session-generator-manager";

export class MobileAppVerifier extends Verifier {
    protected override _assertion: Func<MobileAppVerifier, any>;
    protected _sessionMgr: MobileAppSessionGeneratorManager;
    protected _session: MobileAppSession;
    protected _sessionOptions: MobileAppSessionOptions;

    /**
     * a {MobileAppSessionGeneratorManager} instance used to generate new
     * Mobile App sessions
     */
    get sessionGeneratorManager(): MobileAppSessionGeneratorManager {
        if (!this._sessionMgr) {
            this._sessionMgr = mobileAppSessionGeneratorMgr;
        }
        return this._sessionMgr;
    }

    /**
     * after a new {MobileAppSession} is created, this holds the instance
     * so it can be referenced from within the executing `assertion`
     */
    get session(): MobileAppSession {
        return this._session;
    }

    /**
     * allows for specifying custom {MobileAppSessionOptions} to be used when creating
     * a new {MobileAppSession} prior to executing the `assertion`.
     * NOTE: if not set then only the {MobileAppVerifier.logMgr} will be included in
     * the {MobileAppSessionOptions}
     * @param options the {MobileAppSessionOptions} to be used to create a new {MobileAppSession}
     * @returns this {MobileAppVerifier} instance
     */
    withMobileAppSessionOptions(options: MobileAppSessionOptions): this {
        this._sessionOptions = options;
        return this;
    }

    /**
     * allows for passing in an instance of {MobileAppSessionGeneratorManager} to be
     * used in locating a {AbstractMobileAppSessionGeneratorPlugin} instance to use in 
     * generating a {MobileAppSession}.
     * NOTE: if not set then the global {MobileAppSessionGeneratorManager.instance()}
     * will be used
     * @param sessionMgr a {MobileAppSessionGeneratorManager} to be used instead of the Global instance
     * @returns this {MobileAppVerifier} instance
     */
    withMobileAppSessionGeneratorManager(sessionMgr: MobileAppSessionGeneratorManager): this {
        this._sessionMgr = sessionMgr;
        return this;
    }

    /**
     * the {MobileAppSessionOptions} that will be used when creating a 
     * new {MobileAppSession}
     */
    get sessionOptions(): MobileAppSessionOptions {
        if (!this._sessionOptions) {
            this._sessionOptions = {logMgr: this.logMgr};
        }
        return this._sessionOptions;
    }

    protected override async _resolveAssertion(): Promise<void> {
        let opts: MobileAppSessionOptions = this.sessionOptions;
        opts.logMgr = opts.logMgr || this.logMgr;
        await using(await this.sessionGeneratorManager.newSession(opts), async (session) => {
            this._session = session;
            await super._resolveAssertion();
        });
    }
}

/**
 * creates a new {MobileAppVerifier} instace to be used for executing some Functional
 * Test Assertion.
 * ex:
 * ```
 * await verifyWithMobileApp(async (v: MobileAppVerifier) => {
 *   let facet: MyFacet = await v.session.getFacet(MyFacet);
 *   return await facet.returnExpectedValue();
 * }).withDescription('example usage for MobileAppVerifier')
 * .and.withTestId('C1234')
 * .returns('expected value');
 * ```
 * @param assertion the {Func<MobileAppVerifier, any>} function to be executed by this {MobileAppVerifier}
 * @returns a new {MobileAppVerifier} instance
 */
export const verifyWithMobileApp = (assertion: Func<MobileAppVerifier, any>): MobileAppVerifier => {
    let v: MobileAppVerifier = new MobileAppVerifier();
    v.verify(assertion);
    return v;
}