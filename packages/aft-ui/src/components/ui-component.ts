import { AftConfig, Class, Func, LogManager, aftConfig } from 'aft-core';

export type UiComponentOptions = {
    driver: unknown;

    aftCfg?: AftConfig;
    locator?: unknown;
    parent?: Func<void, Promise<unknown>>;
    logMgr?: LogManager;
};

/**
 * used to encapsulate logical blocks of a UI providing the ability to chain 
 * element lookups back to a root ancestor meaning that individual locators
 * only need to be concerned with elements that exist as a child of the parent
 * of this `UiFacet`. this is especially useful when UI elements exist in
 * multiple places on a page and you only wish to get one instance in a specific
 * location
 */
export abstract class UiComponent {
    public readonly aftCfg: AftConfig;
    public readonly logMgr: LogManager;
    
    protected readonly _driver: unknown;
    protected readonly _parent: Func<void, Promise<unknown>>;
    protected readonly _locator: unknown;
    
    constructor(options: UiComponentOptions) {
        this._driver = options.driver;
        this.aftCfg = options.aftCfg ?? aftConfig;
        this.logMgr ??= options.logMgr ?? new LogManager(this.constructor.name, this.aftCfg);
        this._parent ??= options.parent;
        this._locator ??= options.locator;
    }

    abstract get driver(): unknown;
    abstract get parent(): Func<void, Promise<unknown>>;
    abstract get locator(): unknown;

    abstract getRoot(): Promise<unknown>;

    async getFacet<F extends UiComponent>(facetType: Class<F>, options?: Partial<UiComponentOptions>): Promise<F> {
        options ??= {} as UiComponentOptions;
        options.driver ??= this.driver;
        options.aftCfg ??= this.aftCfg;
        options.logMgr ??= this.logMgr;
        options.parent ??= this.getRoot;
        return new facetType(options);
    }
}