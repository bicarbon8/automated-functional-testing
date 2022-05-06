import { Clazz, LogManager, rand } from 'aft-core';
import { IElementOptions } from './ielement-options';
import { ISession } from '../sessions/isession';

export interface IFacetOptions {
    session?: ISession;
    logMgr?: LogManager;
    maxWaitMs?: number;
    index?: number;
    parent?: AbstractFacet;
    locator?: unknown;
}

export abstract class AbstractFacet {
    readonly session: ISession;
    readonly logMgr: LogManager;
    readonly maxWaitMs: number;
    readonly index: number;
    readonly parent: AbstractFacet;
    readonly locator: unknown;
    
    constructor(options: IFacetOptions) {
        this.locator = this.locator || options.locator;
        this.session = options.session;
        this.logMgr = options.logMgr || new LogManager({ logName: `${this.constructor.name}_${rand.guid}` });
        this.parent = options.parent;
        this.maxWaitMs = (options.maxWaitMs === undefined) ? 10000 : options.maxWaitMs;
        this.index = (options.index === undefined) ? 0 : options.index;
    }

    abstract getElements(options?: IElementOptions): Promise<unknown[]>;
    abstract getElement(options?: IElementOptions): Promise<unknown>;
    abstract getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: IFacetOptions): Promise<T>;
    abstract getRoot(): Promise<unknown>;
}