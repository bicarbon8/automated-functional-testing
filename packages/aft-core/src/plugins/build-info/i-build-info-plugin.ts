import { IPlugin } from "../i-plugin";

export interface IBuildInfoPlugin extends IPlugin {
    readonly pluginType: 'build-info';
    buildName(): Promise<string>;
    buildNumber(): Promise<string>;
}