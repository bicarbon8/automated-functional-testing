import { Merge } from "aft-core";
import { BrowserSession, BrowserSessionOptions } from "../browser-session";

export type BrowserStackBrowserSessionOptions = Merge<BrowserSessionOptions, {
    user?: string;
    key?: string;
    local?: boolean;
    localIdentifier?: string;
    debug?: boolean;
}>;

export class BrowserStackBrowserSession extends BrowserSession<BrowserStackBrowserSessionOptions> {
    private _user: string;
    private _key: string;
    private _local: boolean;
    private _localIdentifier: string;
    private _debug: boolean;

    get user(): string {
        if (!this._user) {
            this._user = this.option('user');
        }
        return this._user;
    }

    get key(): string {
        if (!this._key) {
            this._key = this.option('key');
        }
        return this._key;
    }

    get local(): boolean {
        if (!this._local) {
            this._local = this.option('local');
        }
        return this._local;
    }

    get localIdentifier(): string {
        if (!this._localIdentifier) {
            this._localIdentifier = this.option('localIdentifier');
        }
        return this._localIdentifier;
    }

    get debug(): boolean {
        if (!this._debug) {
            this._debug = this.option('debug');
        }
        return this._debug;
    }
    
    override async dispose(error?: any): Promise<void> {
        try {
            let setStatus: {} = {
                "action": "setSessionStatus",
                "arguments": {
                    "status": (error) ? 'failed' : 'passed',
                    "reason": error || 'successful test'
                }
            };
            await this.driver?.executeScript(`browserstack_executor: ${JSON.stringify(setStatus)}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }
        
        await super.dispose(error);
    }
}