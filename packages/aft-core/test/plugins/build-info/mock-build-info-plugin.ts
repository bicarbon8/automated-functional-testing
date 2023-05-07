import { IBuildInfoPlugin, BuildInfoPluginOptions, Merge, rand } from "../../../src";

export type MockBuildInfoPluginOptions = Merge<BuildInfoPluginOptions, {
    buildName?: string;
    buildNumber?: string;
    buildNumberMin?: number;
    buildNumberMax?: number;
}>;

export class MockBuildInfoPlugin<T extends MockBuildInfoPluginOptions> extends BuildInfoPlugin<T> {
    override async buildName(): Promise<string> {
        return this.option('buildName', `MockBuildName-${rand.getInt(0, 99)}`);
    }
    override async buildNumber(): Promise<string> {
        const min = this.option('buildNumberMin', 100);
        const max = this.option('buildNumberMax', 999);
        return this.option('buildNumber', `MockBuildNumber-${rand.getInt(min, max)}`);
    }
}