import { AftConfig, Class, Func, ReportingManager, aftConfig } from 'aft-core';

export type UiComponentOptions = {
    driver: unknown;

    aftCfg?: AftConfig;
    locator?: unknown;
    parent?: Func<void, Promise<unknown>>;
    reporter?: ReportingManager;
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
    public readonly reporter: ReportingManager;
    
    protected readonly _driver: unknown;
    protected readonly _parent: Func<void, Promise<unknown>>;
    protected readonly _locator: unknown;
    
    constructor(options: UiComponentOptions) {
        this._driver = options.driver;
        this.aftCfg = options.aftCfg ?? aftConfig;
        this.reporter ??= options.reporter ?? new ReportingManager(this.constructor.name, this.aftCfg);
        this._parent ??= options.parent;
        this._locator ??= options.locator;
    }

    /**
     * the top-level interface between the application DOM and the code.
     * for operations within the scope of this `UiComponent` the `getRoot`
     * function should be used instead
     */
    abstract get driver(): unknown;
    /**
     * a function returning the view node object that encapsulates
     * this `UiComponent`. the `parent` can be used to chain a scoped
     * lookup refresh back to the root of the view preventing stale nodes
     */
    abstract get parent(): Func<void, Promise<unknown>>;
    /**
     * the itentifier used to locate this component's root
     */
    abstract get locator(): unknown;

    /**
     * returns the root view node object identified by this component's
     * `locator`. the root node should be used to compartmentalise DOM
     * lookups to a scope only within this `UiComponent`.
     * 
     * #### NOTE:
     * > implementations should resemble the following:
     * >
     * > ```typescript
     * > override async getRoot(): Promise<WebElement> {
     * >    const searchContext = (this.parent != null) ? await this.parent() : this.driver;
     * >    return searchContext.findElement(this.locator);
     * > }
     * > ```
     * > to ensure a fresh lookup of the root and child elements
     */
    abstract getRoot(): Promise<unknown>;

    /**
     * creates a new `UiComponent` instance of the specified type passing in
     * the `driver`, `aftConfig`, `reporter` and `() => this.getRoot()` as `parent`
     * @param componentType a class extending from `UiComponent` providing a
     * Page Object Model interface with the DOM
     * @param options an object allowing for overrides to the default `driver`,
     * `locator`, `parent`, `reporter` and `aftConfig` objects
     * @returns an instance of the specified `UiComponent` class
     */
    getComponent<F extends UiComponent>(componentType: Class<F>, options?: Partial<UiComponentOptions>): F {
        options ??= {} as UiComponentOptions;
        options.driver ??= this.driver;
        options.aftCfg ??= this.aftCfg;
        options.reporter ??= this.reporter;
        options.parent ??= () => this.getRoot();
        return new componentType(options);
    }
}