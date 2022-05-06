import { Plugin, PluginOptions } from "../plugin";

export interface BuildInfoPluginOptions extends PluginOptions {
    buildName?: string;
    buildNumber?: string;
}

export abstract class BuildInfoPlugin extends Plugin<BuildInfoPluginOptions> {
    private _buildName: string;
    private _buildNumber: string;
    async getBuildName(): Promise<string> {
        if (!this._buildName) {
            this._buildName = await this.optionsMgr.getOption('buildName');
        }
        return this._buildName;
    }
    async getBuildNumber(): Promise<string> {
        if (!this._buildNumber) {
            this._buildNumber = await this.optionsMgr.getOption('buildNumber');
        }
        return this._buildNumber;
    }
}