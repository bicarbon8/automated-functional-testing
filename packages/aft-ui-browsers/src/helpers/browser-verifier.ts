import { Func, using, Verifier } from "aft-core";
import { BrowserSession, BrowserSessionOptions } from "../sessions/browser-session";
import { BrowserSessionGeneratorPluginManager } from "../sessions/browser-session-generator-plugin-manager";

export class BrowserVerifier extends Verifier {
    protected _assertion: Func<BrowserVerifier, any>;
    protected _sessionMgr: BrowserSessionGeneratorPluginManager;
    protected _session: BrowserSession;
    protected _sessionOptions: BrowserSessionOptions;

    constructor() {
        super();
        this._sessionMgr = BrowserSessionGeneratorPluginManager.instance();
        this._sessionOptions = {logMgr: this.logMgr};
    }

    get and(): BrowserVerifier {
        return this;
    }

    get session(): BrowserSession {
        return this._session;
    }

    verify(assertion: Func<BrowserVerifier, any>): BrowserVerifier {
        this._assertion = assertion;
        return this;
    }

    withBrowserSessionOptions(options: BrowserSessionOptions): BrowserVerifier {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        this._sessionOptions = options;
        return this;
    }

    withBrowserSessionGeneratorPluginManager(sessionMgr: BrowserSessionGeneratorPluginManager): BrowserVerifier {
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

export const verifyWithBrowser = (assertion: Func<BrowserVerifier, any>) => {
    let v: BrowserVerifier = new BrowserVerifier();
    v.verify(assertion);
    return v;
}