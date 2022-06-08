import { FakeWebElement } from "./fake-web-element";
import { Class, Merge, wait } from "aft-core";
import { UiElementOptions, UiFacet, UiFacetOptions } from "../../src";
import { FakeLocator } from "./fake-locator";
import { FakeSession } from "../sessions/fake-session";

export type FakeElementOptions = Merge<UiElementOptions, {
    locator: FakeLocator;
}>;

export type FakeFacetOptions = Merge<UiFacetOptions, {
    parent?: FakeFacet;
    session?: FakeSession;
    locator?: FakeLocator;
}>;

export class FakeFacet extends UiFacet<FakeFacetOptions> {
    override get parent(): FakeFacet {
        return super.parent as FakeFacet;
    }
    override get locator(): FakeLocator {
        return super.locator as FakeLocator;
    }
    override get session(): FakeSession {
        return super.session as FakeSession;
    }
    override async getRoot(): Promise<FakeWebElement> {
        let r: FakeWebElement;
        const maxWait = this.maxWaitMs;
        const loc = this.locator;
        const index = this.index;
        await wait.untilTrue(async () => {
            if (this.parent) {
                r = await this.parent.getRoot()
                    .then(p => p.findElements(loc)[index]);
            } else {
                r = await this.session.driver.findElements(loc)[index];
            }
            return true;
        }, maxWait);
        return r;
    }
    override async getElements(options: FakeElementOptions): Promise<FakeWebElement[]> {
        let elements: FakeWebElement[];
        let duration: number = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        await wait.untilTrue(async () => {
            elements = await this.getRoot()
                .then(r => r.findElements(options.locator));
            return elements.length > 0;
        }, duration);
        return elements;
    }
    override async getElement(options: FakeElementOptions): Promise<FakeWebElement> {
        let element: FakeWebElement;
        let duration: number = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        await wait.untilTrue(async () => {
            element = await this.getRoot()
                .then(r => r.findElement(options.locator));
            return !!element;
        }, duration);
        return element;
    }
    override async getFacet<F extends UiFacet<FakeFacetOptions>>(facetType: Class<F>, options?: FakeFacetOptions): Promise<F> {
        options = options || {} as FakeFacetOptions;
        options.index = options.index || 0;
        options.logMgr = options.logMgr || this.logMgr;
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        let facet: F = new facetType(options);
        return facet;
    }
}