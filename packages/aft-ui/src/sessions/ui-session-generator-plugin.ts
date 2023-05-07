import { Plugin, AftLog, Merge, PluginOptions } from "aft-core";
import { UiPlatform } from "../configuration/ui-platform";
import { UiSession, UiSessionOptions } from "./ui-session";

export type UiSessionGeneratorPluginOptions = Merge<PluginOptions, {
    uiplatform?: string;
    logMgr?: AftLog;
}>;

export abstract class UiSessionGeneratorPlugin<T extends UiSessionGeneratorPluginOptions> extends Plugin<T> {
    private _logMgr: AftLog;
    private _platform: UiPlatform;
    get logMgr(): AftLog {
        if (!this._logMgr) {
            this._logMgr = this.option('logMgr') || new AftLog({logName: this.constructor.name});
        }
        return this._logMgr;
    }
    get uiplatform(): UiPlatform {
        if (!this._platform) {
            let plt: string = this.option('uiplatform');
            this._platform = UiPlatform.parse(plt);
        }
        return this._platform;
    }
    abstract newUiSession(options?: UiSessionOptions): Promise<UiSession<any>>;
}