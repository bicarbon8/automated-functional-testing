import { Plugin, PluginOptions, LogManager } from "aft-core";
import { TestPlatform } from "../configuration/test-platform";
import { ISession, ISessionOptions } from "./isession";

export interface SessionGeneratorPluginOptions extends PluginOptions {
    /**
     * [OPTIONAL] allows for specifying the OS, OS Version, Browser,
     * Browser Version and Device Name to be used. if not set a 
     * {TestPlatform} using values of {TestPlatform.ANY} will be used
     */
    platform?: string;

    /**
     * [OPTIONAL] if not specified a new {LoggingPluginManager} will be created using
     * the Class name as the {logName}
     */
    logMgr?: LogManager;
}

export abstract class SessionGeneratorPlugin extends Plugin<SessionGeneratorPluginOptions> {
    readonly logMgr: LogManager;
    private _platform: TestPlatform;
    constructor(options?: SessionGeneratorPluginOptions) {
        super(options);
        this.logMgr = options?.logMgr || new LogManager({logName: this.optionsMgr.key});
    }
    async getPlatform(): Promise<TestPlatform> {
        if (!this._platform) {
            let plt: string = await this.optionsMgr.get('platform');
            if (plt) {
                this._platform = TestPlatform.parse(plt);
            }
        }
        return this._platform;
    }
    abstract newSession(options?: ISessionOptions): Promise<ISession>;
}