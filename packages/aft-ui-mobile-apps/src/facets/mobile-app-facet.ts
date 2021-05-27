import { Clazz, wait } from "aft-core";
import { AbstractFacet, IElementOptions, IFacetOptions } from "aft-ui";
import { MobileAppSession } from "../sessions/mobile-app-session";
import { ElementArray, Element } from "webdriverio";

export interface MobileAppElementOptions extends IElementOptions {
    locator: string;
}

export interface MobileAppFacetOptions extends IFacetOptions {
    locator?: string;
    session?: MobileAppSession;
    parent?: MobileAppFacet;
}

export class MobileAppFacet extends AbstractFacet {
    override readonly locator: string;
    override readonly session: MobileAppSession;
    override readonly parent: MobileAppFacet;

    override async getElements(options: MobileAppElementOptions): Promise<ElementArray> {
        let elements: ElementArray
        await wait.untilTrue(async () => {
            elements = await this.getRoot().then(async (r) => await r.$$(options.locator));
            return elements.length > 0;
        }, options.maxWaitMs || 0);
        return elements;
    }

    override async getElement(options: MobileAppElementOptions): Promise<Element<'async'>> {
        let element: Element<'async'>;
        await wait.untilTrue(async () => {
            element = await this.getRoot()
                .then(async r => await r.$(options.locator));
            return !!element;
        }, options.maxWaitMs || 0);
        return element;
    }
    
    override async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: MobileAppFacetOptions): Promise<T> {
        options = options || {};
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        let facet: T = new facetType(options);
        return facet;
    }
    
    override async getRoot(): Promise<Element<'async'>>  {
        let el: Element<'async'>;
        await wait.untilTrue(async () => {
            if (this.parent) {
                let els: ElementArray = await this.parent.getRoot()
                    .then(async r => await r.$$(this.locator));
                el = els[this.index];
            } else {
                let els: ElementArray = await this.session.driver.$$(this.locator);
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