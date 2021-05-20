import { FakeWebElement } from "./fake-web-element";
import { Clazz, wait } from "aft-core";
import { AbstractFacet, IElementOptions, IFacetOptions } from "../../src";
import { FakeLocator } from "./fake-locator";
import { FakeSession } from "../sessions/fake-session";

export interface FakeElementOptions extends IElementOptions {
    locator: FakeLocator;
}

export interface FakeFacetOptions extends IFacetOptions {
    locator?: FakeLocator;
    session?: FakeSession;
    parent?: FakeFacet;
}

export class FakeFacet extends AbstractFacet {
    readonly locator: FakeLocator;
    readonly session: FakeSession;
    readonly parent: FakeFacet;
    constructor(options?: FakeFacetOptions) {
        super(options);
    }
    async getRoot(): Promise<FakeWebElement> {
        let r: FakeWebElement;
        await wait.untilTrue(async () => {
            if (this.parent) {
                r = await this.parent.getRoot()
                    .then(async p => await p.findElements(this.locator)[this.index]);
            } else {
                r = await this.session.driver.findElements(this.locator)[this.index];
            }
            return true;
        }, this.maxWaitMs);
        return r;
    }

    async getElements(options: FakeElementOptions): Promise<FakeWebElement[]> {
        let elements: FakeWebElement[];
        let duration: number = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        await wait.untilTrue(async () => {
            elements = await this.getRoot()
                .then(async r => await r.findElements(options.locator));
            return elements.length > 0;
        }, duration);
        return elements;
    }

    async getElement(options: FakeElementOptions): Promise<FakeWebElement> {
        let element: FakeWebElement;
        let duration: number = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        await wait.untilTrue(async () => {
            element = await this.getRoot()
                .then(async r => await r.findElement(options.locator));
            return !!element;
        }, duration);
        return element;
    }

    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: FakeFacetOptions): Promise<T> {
        options = options || {};
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        let facet: T = new facetType(options);
        return facet;
    }
}