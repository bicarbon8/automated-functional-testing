import { Func, using, Verifier } from "aft-core";
import { BrowserSession, BrowserSessionOptions } from "../sessions/browser-session";
import { BrowserSessionGeneratorPluginManager } from "../sessions/browser-session-generator-plugin-manager";

export class BrowserVerifier extends Verifier {
    protected _assertion: Func<BrowserVerifier, any>;
    protected _sessionMgr: BrowserSessionGeneratorPluginManager;
    protected _session: BrowserSession;
    protected _withBrowserPromise: Promise<BrowserSession>;

    constructor() {
        super();
        this._sessionMgr = BrowserSessionGeneratorPluginManager.instance();
        this._withBrowserPromise = new Promise<BrowserSession>(async (resolve, reject) => {
            let session: BrowserSession = await this._sessionMgr.newSession({logMgr: this.logMgr});
            resolve(session);
        });
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

    withBrowserFrom(options: BrowserSessionOptions): BrowserVerifier {
        options = options || {};
        options.logMgr = options.logMgr || this.logMgr;
        this._withBrowserPromise = new Promise<BrowserSession>(async (resolve, reject) => {
            let session: BrowserSession = await this._sessionMgr.newSession(options);
            resolve(session);
        });
        return this;
    }

    withBrowserSessionGeneratorPluginManager(sessionMgr: BrowserSessionGeneratorPluginManager): BrowserVerifier {
        this._sessionMgr = sessionMgr;
        return this;
    }

    protected async _resolveAssertion(): Promise<void> {
        await using(await Promise.resolve(this._withBrowserPromise), async (session) => {
            this._session = session;
            await super._resolveAssertion();
        });
    }
}

export const browserVerifier = (assertion: Func<BrowserVerifier, any>) => {
    let v: BrowserVerifier = new BrowserVerifier();
    v.verify(assertion);
    return v;
}