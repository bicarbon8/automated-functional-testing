import { Class, Merge, retry, wait } from "aft-core";
import { UiFacet, UiElementOptions, UiFacetOptions } from "aft-ui";
import { By, Locator, WebElement } from "selenium-webdriver";
import { BrowserSession } from "../sessions/browser-session";

export type WebElementOptions = Merge<UiElementOptions, {
    locator: Locator;
}>;

export type BrowserFacetOptions = Merge<UiFacetOptions, {
    locator?: Locator;
    session?: BrowserSession<any>;
    parent?: BrowserFacet;
}>;

export class BrowserFacet extends UiFacet<BrowserFacetOptions> {
    override get locator(): Locator {
        return super.locator as Locator;
    }
    
    override get session(): BrowserSession<any> {
        return super.session as BrowserSession<any>;
    }
    
    override get parent(): BrowserFacet {
        return super.parent as BrowserFacet;
    }

    override async getElements(options: WebElementOptions): Promise<WebElement[]> {
        const elements: WebElement[] = await wait.forResult(() => retry
            .untilResult(() => this.getRoot()
                .then(r => r.findElements(options.locator)), 100, 'linear'), 
                    options.maxWaitMs || 0);
        return elements;
    }

    override async getElement(options: WebElementOptions): Promise<WebElement> {
        const element: WebElement = await wait.forResult(() => retry
            .untilResult(() => this.getRoot()
                .then(r => r.findElement(options.locator)), 100, 'linear'),
                    options.maxWaitMs || 0);
        return element;
    }
    
    override async getFacet<T extends UiFacet<BrowserFacetOptions>>(facetType: Class<T>, options?: BrowserFacetOptions): Promise<T> {
        options = options || {} as BrowserFacetOptions;
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        const facet: T = new facetType(options);
        return facet;
    }
    
    override async getRoot(): Promise<WebElement>  {
        const index = this.index;
        const loc = this.locator;
        const maxWait = this.maxWaitMs;
        return wait.forResult(() => retry.untilResult(() => {
            if (this.parent) {
                return this.parent.getRoot()
                    .then(r => r.findElements(loc))
                    .then(els => els[index]);
            } else {
                return this.session.driver.findElements(loc)
                    .then(els => els[index]);
            }
        }, 100, 'linear'), maxWait);
    }
}