import { Class, Disposable, AftLog, rand, IHasOptions, optmgr } from "aft-core";
import { UiPlatform } from "../configuration/ui-platform";
import { UiFacet, UiFacetOptions } from "../facets/ui-facet";

export type UiSessionOptions = {
    logMgr?: AftLog;
    uiplatform?: string;
    driver?: unknown;
};

export abstract class UiSession<T extends UiSessionOptions> implements IHasOptions<T>, Disposable {
    private readonly _options: T;

    private _platform: UiPlatform;
    private _logMgr: AftLog;

    constructor(options?: T) {
        options = options || {} as T;
        this._options = optmgr.process(options);
    }

    option<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): V {
        const result: V = this._options[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    abstract readonly driver: unknown;

    get platform(): UiPlatform {
        if (!this._platform) {
            const pltStr: string = this.option('uiplatform');
            this._platform = UiPlatform.parse(pltStr);
        }
        return this._platform;
    }
    
    get logMgr(): AftLog {
        if (!this._logMgr) {
            this._logMgr = this.option('logMgr') || new AftLog({logName: `${this.constructor.name}_${this.platform}_${rand.getString(4, false, true)}`});
        }
        return this._logMgr;
    }

    abstract getFacet<F extends UiFacet<any>, Fo extends UiFacetOptions>(facetType: Class<F>, options?: Fo): Promise<F>;
    abstract dispose(error?: any): Promise<void>;
}