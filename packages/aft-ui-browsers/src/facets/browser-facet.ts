import { Clazz, wait } from "aft-core";
import { AbstractFacet, IElementOptions, IFacetOptions } from "aft-ui";
import { Locator, WebElement } from "selenium-webdriver";
import { BrowserSession } from "../sessions/browser-session";

export interface WebElementOptions extends IElementOptions {
    locator: Locator;
}

export interface BrowserFacetOptions extends IFacetOptions {
    locator?: Locator;
    session?: BrowserSession;
    parent?: BrowserFacet;
}

export class BrowserFacet extends AbstractFacet {
    override readonly locator: Locator;
    override readonly session: BrowserSession;
    override readonly parent: BrowserFacet;

    async getElements(options: WebElementOptions): Promise<WebElement[]> {
        let elements: WebElement[]
        await wait.untilTrue(async () => {
            elements = await this.getRoot().then(async (r) => await r.findElements(options.locator));
            return elements.length > 0;
        }, options.maxWaitMs || 0);
        return elements;
    }

    async getElement(options: WebElementOptions): Promise<WebElement> {
        let element: WebElement;
        await wait.untilTrue(async () => {
            element = await this.getRoot()
                .then(async r => await r.findElement(options.locator));
            return !!element;
        }, options.maxWaitMs || 0);
        return element;
    }
    
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: BrowserFacetOptions): Promise<T> {
        options = options || {};
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        let facet: T = new facetType(options);
        return facet;
    }
    
    async getRoot(): Promise<WebElement>  {
        let el: WebElement;
        await wait.untilTrue(async () => {
            if (this.parent) {
                let els: WebElement[] = await this.parent.getRoot()
                    .then(async r => await r.findElements(this.locator));
                el = els[this.index];
            } else {
                let els: WebElement[] = await this.session.driver.findElements(this.locator);
                el = els[this.index];
            }
            if (el) {
                return true;
            }
            return false;
        }, this.maxWaitMs);
        return el;
    }
}