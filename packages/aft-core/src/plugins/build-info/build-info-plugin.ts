import { Plugin, PluginOptions } from "../plugin";

export type BuildInfoPluginOptions = PluginOptions;

export abstract class BuildInfoPlugin<T extends BuildInfoPluginOptions> extends Plugin<T> {
    abstract buildName(): Promise<string>;
    abstract buildNumber(): Promise<string>;
}