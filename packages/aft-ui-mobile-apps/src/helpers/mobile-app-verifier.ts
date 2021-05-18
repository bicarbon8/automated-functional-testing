import { Func, using, Verifier } from "aft-core";
import { MobileAppSession, MobileAppSessionOptions } from "../sessions/mobile-app-session";
import { MobileAppSessionGeneratorPluginManager } from "../sessions/mobile-app-session-generator-plugin-manager";

export class MobileAppVerifier extends Verifier {
    protected _assertion: Func<MobileAppVerifier, any>;
    protected _sessionMgr: MobileAppSessionGeneratorPluginManager;
    protected _session: MobileAppSession;
    protected _sessionOptions: MobileAppSessionOptions;

    get and(): MobileAppVerifier {
        return this;
    }

    get sessionGeneratorPluginManager(): MobileAppSessionGeneratorPluginManager {
        if (!this._sessionMgr) {
            this._sessionMgr = MobileAppSessionGeneratorPluginManager.instance();
        }
        return this._sessionMgr;
    }

    get session(): MobileAppSession {
        return this._session;
    }

    verify(assertion: Func<MobileAppVerifier, any>): MobileAppVerifier {
        this._assertion = assertion;
        return this;
    }

    withMobileAppSessionOptions(options: MobileAppSessionOptions): MobileAppVerifier {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        this._sessionOptions = options;
        return this;
    }

    withMobileAppSessionGeneratorPluginManager(sessionMgr: MobileAppSessionGeneratorPluginManager): MobileAppVerifier {
        this._sessionMgr = sessionMgr;
        return this;
    }

    get sessionOptions(): MobileAppSessionOptions {
        if (!this._sessionOptions) {
            this._sessionOptions = {logMgr: this.logMgr};
        }
        return this._sessionOptions;
    }

    protected async _resolveAssertion(): Promise<void> {
        await using(await this.sessionGeneratorPluginManager.newSession(this.sessionOptions), async (session) => {
            this._session = session;
            await super._resolveAssertion();
        });
    }
}

export const verifyWithMobileApp = (assertion: Func<MobileAppVerifier, any>) => {
    let v: MobileAppVerifier = new MobileAppVerifier();
    v.verify(assertion);
    return v;
}