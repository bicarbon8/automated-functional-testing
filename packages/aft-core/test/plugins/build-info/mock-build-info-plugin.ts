import { AbstractBuildInfoPlugin, IBuildInfoPluginOptions, rand } from "../../../src";

export class MockBuildInfoPlugin extends AbstractBuildInfoPlugin {
    constructor(options?: IBuildInfoPluginOptions) {
        super(options);
    }
    async onLoad(): Promise<void> {
        /* do nothing */
    }
    override async getBuildName(): Promise<string> {
        return `MockBuildName-${rand.getInt(0, 99)}`;
    }
    override async getBuildNumber(): Promise<string> {
        return `MockBuildNumber-${rand.getInt(100, 999)}`;
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
}