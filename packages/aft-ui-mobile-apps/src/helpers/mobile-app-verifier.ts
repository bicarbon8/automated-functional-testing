import { Func, using, Verifier } from "aft-core";
import { MobileAppSession, MobileAppSessionOptions } from "../sessions/mobile-app-session";
import { MobileAppSessionGeneratorPluginManager } from "../sessions/mobile-app-session-generator-plugin-manager";

export class MobileAppVerifier extends Verifier {
    protected _assertion: Func<MobileAppVerifier, any>;
    protected _sessionMgr: MobileAppSessionGeneratorPluginManager;
    protected _session: MobileAppSession;
    protected _sessionOptions: MobileAppSessionOptions;

    constructor() {
        super();
        this._sessionMgr = MobileAppSessionGeneratorPluginManager.instance();
        this._sessionOptions = {logMgr: this.logMgr};
    }

    get and(): MobileAppVerifier {
        return this;
    }

    get session(): MobileAppSession {
        return this._session;
    }

    verify(assertion: Func<MobileAppVerifier, any>): MobileAppVerifier {
        this._assertion = assertion;
        return this;
    }

    withMobileAppFrom(options: MobileAppSessionOptions): MobileAppVerifier {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        this._sessionOptions = options;
        return this;
    }

    withMobileAppSessionGeneratorPluginManager(sessionMgr: MobileAppSessionGeneratorPluginManager): MobileAppVerifier {
        this._sessionMgr = sessionMgr;
        return this;
    }

    protected async _resolveAssertion(): Promise<void> {
        await using(await this._sessionMgr.newSession(this._sessionOptions), async (session) => {
            this._session = session;
            await super._resolveAssertion();
        });
    }
}

export const mobileAppVerifier = (assertion: Func<MobileAppVerifier, any>) => {
    let v: MobileAppVerifier = new MobileAppVerifier();
    v.verify(assertion);
    return v;
}