import { Class, Merge, wait } from "aft-core";
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
        let elements: WebElement[]
        await wait.untilTrue(async () => {
            elements = await this.getRoot().then(r => r.findElements(options.locator));
            return elements.length > 0;
        }, options.maxWaitMs || 0);
        return elements;
    }

    override async getElement(options: WebElementOptions): Promise<WebElement> {
        let element: WebElement;
        await wait.untilTrue(async () => {
            element = await this.getRoot()
                .then(r => r.findElement(options.locator));
            return !!element;
        }, options.maxWaitMs || 0);
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
        let el: WebElement;
        const index = this.index;
        const loc = this.locator;
        const maxWait = this.maxWaitMs;
        await wait.untilTrue(async () => {
            if (this.parent) {
                let els: WebElement[] = await this.parent.getRoot()
                    .then(r => r.findElements(loc));
                el = els[index];
            } else {
                let els: WebElement[] = await this.session.driver.findElements(loc);
                el = els[index];
            }
            if (el) {
                return true;
            }
            return false;
        }, maxWait);
        return el;
    }
}