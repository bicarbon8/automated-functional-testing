import { Class, RetryBackOffType, IHasOptions, AftLog, optmgr, rand } from 'aft-core';
import { UiSession } from '../sessions/ui-session';
import { UiElementOptions } from './ui-element-options';

export type UiFacetOptions = {
    index?: number;
    locator?: unknown;
    parent?: UiFacet<any>;
    session?: UiSession<any>;
    logMgr?: AftLog;
    maxWaitMs?: number;
    retryDelayMs?: number;
    retryDelayBackOff?: RetryBackOffType;
};

export abstract class UiFacet<T extends UiFacetOptions> implements IHasOptions<T> {
    private _logMgr: AftLog;
    private _opts: T;

    constructor(options?: T) {
        options = options || {} as T
        this._opts = optmgr.process(options);
    }

    option<K extends keyof T, V extends T[K]>(key: K, defaultVal?: V): V {
        const result: V = this._opts[key] as V;
        return (result === undefined) ? defaultVal : result;
    }

    get logMgr(): AftLog {
        if (!this._logMgr) {
            this._logMgr = this.option('logMgr') || new AftLog({logName: `${this.constructor.name}_${rand.guid}`});
        }
        return this._logMgr;
    }

    get index(): number {
        return this.option('index', 0);
    }

    get maxWaitMs(): number {
        return this.option('maxWaitMs', 10000);
    }

    get retryDelayMs(): number {
        return this.option('retryDelayMs', 100);
    }

    get retryDelayBackOff(): RetryBackOffType {
        return this.option('retryDelayBackOff', 'linear');
    }

    get locator(): unknown {
        return this.option('locator');
    }
    
    get session(): UiSession<any> {
        return this.option('session');
    }
    
    get parent(): UiFacet<any> {
        return this.option('parent');
    }

    abstract getElements(options?: UiElementOptions): Promise<unknown[]>;
    abstract getElement(options?: UiElementOptions): Promise<unknown>;
    abstract getFacet<F extends UiFacet<T>>(facetType: Class<F>, options?: T): Promise<F>;
    abstract getRoot(): Promise<unknown>;
}