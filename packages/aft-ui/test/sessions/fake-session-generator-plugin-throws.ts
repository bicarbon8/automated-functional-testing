import { AbstractSessionGeneratorPlugin } from "../../src/sessions/abstract-session-generator-plugin";
import { ISessionOptions } from "../../src";
import { testdata } from "./test-data-helper";
import { FakeSessionGeneratorPluginOptions } from "./fake-session-generator-plugin";
import { nameof } from "ts-simple-nameof";
import { FakeSession } from "./fake-session";

export class FakeSessionGeneratorPluginThrows extends AbstractSessionGeneratorPlugin {
    constructor(options?: FakeSessionGeneratorPluginOptions) {
        testdata.set('constructor', options);
        super(nameof(FakeSessionGeneratorPluginThrows).toLowerCase(), options);
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