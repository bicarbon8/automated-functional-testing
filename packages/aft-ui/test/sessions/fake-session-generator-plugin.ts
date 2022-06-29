import { UiSession, UiSessionGeneratorPlugin, UiSessionGeneratorPluginOptions } from "../../src";
import { FakeDriver } from "./fake-driver";
import { FakeSession, FakeSessionOptions } from "./fake-session";

export type FakeSessionGeneratorPluginOptions = UiSessionGeneratorPluginOptions;

export class FakeSessionGeneratorPlugin extends UiSessionGeneratorPlugin<FakeSessionGeneratorPluginOptions> {
    async getDriver(): Promise<FakeDriver> {
        return new FakeDriver();
    }
    
    override async newUiSession(options?: FakeSessionOptions): Promise<FakeSession> {
        options = options || {} as FakeSessionOptions;
        options.logMgr = options.logMgr || this.logMgr;
        options.driver = options.driver || await this.getDriver();
        return new FakeSession(options);
    }
}