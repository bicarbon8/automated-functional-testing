import { nameof } from "ts-simple-nameof";
import { AbstractSessionGeneratorPlugin, ISessionGeneratorPluginOptions } from "../../src";
import { FakeDriver } from "./fake-driver";
import { FakeSession, FakeSessionOptions } from "./fake-session";
import { testdata } from "./test-data-helper";

export interface FakeSessionGeneratorPluginOptions extends ISessionGeneratorPluginOptions {

}

export class FakeSessionGeneratorPlugin extends AbstractSessionGeneratorPlugin {
    constructor(options?: FakeSessionGeneratorPluginOptions) {
        super(nameof(FakeSessionGeneratorPlugin).toLowerCase(), options);
        testdata.set('constructor', options);
    }
    async onLoad(): Promise<void> {
        testdata.set('onload', true);
    }
    async newSession(options?: FakeSessionOptions): Promise<FakeSession> {
        testdata.set('newsession', options);
        return await this.enabled().then((enabled) => {
            if (enabled) {
                let session: FakeSession = new FakeSession({
                    driver: options?.driver || new FakeDriver(),
                    logMgr: options?.logMgr || this.logMgr
                });
                return session;
            }
            return null;
        });
    }
    async dispose(error?: Error): Promise<void> {
        testdata.set('dispose', error || true);
    }
}