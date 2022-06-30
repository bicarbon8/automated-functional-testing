import { Merge } from "aft-core";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";

export type BrowserStackMobileAppSessionOptions = Merge<MobileAppSessionOptions, {
    user?: string;
    key?: string;
    debug?: boolean;
    local?: boolean;
    localIdentifier?: string;
}>;

export class BrowserStackMobileAppSession extends MobileAppSession<BrowserStackMobileAppSessionOptions> {
    private _user: string;
    private _key: string;
    private _debug: boolean;
    private _local: boolean;
    private _localIdentifier: string;

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

    get debug(): boolean {
        if (this._debug === undefined) {
            this._debug = this.option('debug', false);
        }
        return this._debug;
    }

    get local(): boolean {
        if (this._local === undefined) {
            this._local = this.option('local', false);
        }
        return this._local;
    }

    get localIdentifier(): string {
        if (!this._localIdentifier) {
            this._localIdentifier = this.option('localIdentifier');
        }
        return this._localIdentifier;
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
            await this.driver?.execute(`browserstack_executor: ${JSON.stringify(setStatus)}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }
        
        await super.dispose(error);
    }
}