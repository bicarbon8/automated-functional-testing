import { Clazz, IDisposable, LoggingPluginManager } from "aft-core";
import { AbstractFacet, IFacetOptions } from "../facets/abstract-facet";

export interface ISessionOptions {
    /**
     * required to instantiate a valid {ISession}
     */
    driver?: unknown;
    /**
     * required to keep continuity between {ISession} 
     * and {IFacet} logging
     */
    logMgr?: LoggingPluginManager;
}

export interface ISession extends IDisposable {
    readonly driver: unknown;
    readonly logMgr: LoggingPluginManager;
    getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: IFacetOptions): Promise<T>;
    goTo(url: string): Promise<ISession>;
    refresh(): Promise<ISession>;
    resize(width: number, height: number): Promise<ISession>;
}