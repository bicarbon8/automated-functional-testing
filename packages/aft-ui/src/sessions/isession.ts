import { Clazz, IDisposable, LogManager } from "aft-core";
import { TestPlatform } from "../configuration/test-platform";
import { AbstractFacet, IFacetOptions } from "../facets/abstract-facet";

export interface ISessionOptions {
    /**
     * required to instantiate a valid {ISession}
     */
    driver?: unknown;
    /**
     * [OPTIONAL] defaults to {TestPlatform.ANY}
     */
    platform?: string;
    /**
     * required to keep continuity between {ISession} 
     * and {IFacet} logging
     */
    logMgr?: LogManager;
}

export interface ISession extends IDisposable {
    readonly driver: unknown;
    readonly platform: TestPlatform;
    readonly logMgr: LogManager;
    getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: IFacetOptions): Promise<T>;
}