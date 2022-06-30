import { Merge } from "aft-core";
import { MobileAppSession, MobileAppSessionOptions } from "../mobile-app-session";

export type SauceLabsMobileAppSessionOptions = Merge<MobileAppSessionOptions, {
    username?: string;
    accessKey?: string;
    tunnel?: boolean;
    tunnelIdentifier?: string;
}>;

export class SauceLabsMobileAppSession extends MobileAppSession<SauceLabsMobileAppSessionOptions> {
    private _username: string;
    private _accessKey: string;
    private _tunnel: boolean;
    private _tunnelIdentifier: string;

    get username(): string {
        if (!this._username) {
            this._username = this.option('username');
        }
        return this._username;
    }

    get accessKey(): string {
        if (!this._accessKey) {
            this._accessKey = this.option('accessKey');
        }
        return this._accessKey;
    }

    get tunnel(): boolean {
        if (this._tunnel === undefined) {
            this._tunnel = this.option('tunnel', false);
        }
        return this._tunnel;
    }

    get tunnelIdentifier(): string {
        if (!this._tunnelIdentifier) {
            this._tunnelIdentifier = this.option('tunnelIdentifier');
        }
        return this._tunnelIdentifier;
    }
    
    override async dispose(error: any): Promise<void> {
        try {
            await this.driver?.execute(`sauce:job-result=${(error) ? 'failed' : 'passed'}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }

        await super.dispose(error);
    }
}