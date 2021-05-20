import { nameof } from "ts-simple-nameof";
import { AbstractPlugin, IPluginOptions, LoggingPluginManager } from "aft-core";
import { TestPlatform } from "../configuration/test-platform";
import { ISession, ISessionOptions } from "./isession";

export interface ISessionGeneratorPluginOptions extends IPluginOptions {
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
    logMgr?: LoggingPluginManager;
}

export abstract class AbstractSessionGeneratorPlugin extends AbstractPlugin<ISessionGeneratorPluginOptions> {
    readonly logMgr: LoggingPluginManager;
    private _platform: TestPlatform;
    constructor(key: string, options?: ISessionGeneratorPluginOptions) {
        super(key, options);
        this.logMgr = options?.logMgr || new LoggingPluginManager({logName: this.constructor.name});
    }
    async getPlatform(): Promise<TestPlatform> {
        if (!this._platform) {
            let plt: string = await this.optionsMgr.getOption(nameof<ISessionGeneratorPluginOptions>(o => o.platform));
            if (plt) {
                this._platform = TestPlatform.parse(plt);
            }
        }
        return this._platform;
    }
    abstract newSession(options?: ISessionOptions): Promise<ISession>;
}