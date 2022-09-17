import { Class, Merge, retry, wait } from "aft-core";
import { UiFacet, UiElementOptions, UiFacetOptions } from "aft-ui";
import { Locator, WebElement } from "selenium-webdriver";
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
        const maxWait = options.maxWaitMs ?? this.maxWaitMs;
        const delay = options.retryDelayMs ?? this.retryDelayMs;
        const delayType = options.retryDelayBackOff ?? this.retryDelayBackOff;
        return wait.forResult(() => retry
            .untilResult(() => this.getRoot()
                .then(r => r.findElements(options.locator)), delay, delayType), maxWait);
    }

    override async getElement(options: WebElementOptions): Promise<WebElement> {
        const maxWait = options.maxWaitMs ?? this.maxWaitMs;
        const delay = options.retryDelayMs ?? this.retryDelayMs;
        const delayType = options.retryDelayBackOff ?? this.retryDelayBackOff;
        const element: WebElement = await wait.forResult(() => retry
            .untilResult(() => this.getRoot()
                .then(r => r.findElement(options.locator)), delay, delayType), maxWait);
        return element;
    }
    
    override async getFacet<T extends UiFacet<BrowserFacetOptions>>(facetType: Class<T>, options?: BrowserFacetOptions): Promise<T> {
        options = options || {} as BrowserFacetOptions;
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = options.maxWaitMs ?? this.maxWaitMs;
        options.retryDelayMs = options.retryDelayMs ?? this.retryDelayMs;
        options.retryDelayBackOff = options.retryDelayBackOff ?? this.retryDelayBackOff;
        const facet: T = new facetType(options);
        return facet;
    }
    
    override async getRoot(): Promise<WebElement>  {
        return wait.forResult(() => retry.untilResult(() => {
            if (this.parent) {
                return this.parent.getRoot()
                    .then(r => r.findElements(this.locator))
                    .then(els => els[this.index]);
            } else {
                return this.session.driver.findElements(this.locator)
                    .then(els => els[this.index]);
            }
        }, this.retryDelayMs, this.retryDelayBackOff), this.maxWaitMs);
    }
}