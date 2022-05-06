import { SessionGeneratorPlugin } from "../../src/sessions/session-generator-plugin";
import { ISessionOptions } from "../../src";
import { testdata } from "./test-data-helper";
import { FakeSessionGeneratorPluginOptions } from "./fake-session-generator-plugin";
import { FakeSession } from "./fake-session";

export class FakeSessionGeneratorPluginThrows extends SessionGeneratorPlugin {
    constructor(options?: FakeSessionGeneratorPluginOptions) {
        testdata.set('constructor', options);
        super(options);
    }
    async onLoad(): Promise<void> {
        testdata.set('onload', true);
    }
    async newSession(options?: ISessionOptions): Promise<FakeSession> {
        testdata.set('newsession', options);
        throw new Error("Method not implemented.");
    }
    async dispose(error?: Error): Promise<void> {
        testdata.set('dispose', error || true);
        throw new Error("Method not implemented.");
    }
}