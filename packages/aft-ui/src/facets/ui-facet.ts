import { AftConfig, Class, Func, LogManager, aftConfig } from 'aft-core';
import { By, WebDriver, WebElement } from 'selenium-webdriver';

export type UiFacetOptions = {
    driver: WebDriver;

    aftCfg?: AftConfig;
    locator?: By;
    parent?: Func<void, Promise<WebElement>>;
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
export class UiFacet {
    public readonly driver: WebDriver;
    public readonly aftCfg: AftConfig;
    public readonly logMgr: LogManager;
    public readonly parent: Func<void, Promise<WebElement>>;
    public readonly locator: By;
    
    constructor(options: UiFacetOptions) {
        this.driver = options.driver;
        this.aftCfg = options.aftCfg ?? aftConfig;
        this.logMgr ??= options.logMgr ?? new LogManager(this.constructor.name, this.aftCfg);
        this.parent ??= options.parent;
        this.locator ??= options.locator;
    }

    async getRoot(): Promise<WebElement> {
        const parent = (this.parent != null) ? await this.parent() : this.driver;
        return parent.findElement(this.locator);
    }

    async getFacet<F extends UiFacet>(facetType: Class<F>, options?: UiFacetOptions): Promise<F> {
        options ??= {} as UiFacetOptions;
        options.driver ??= this.driver;
        options.aftCfg ??= this.aftCfg;
        options.logMgr ??= this.logMgr;
        options.parent ??= this.getRoot;
        return new facetType(options);
    }
}