import { Class, Merge, retry, wait } from "aft-core";
import { UiFacet, UiElementOptions, UiFacetOptions } from "aft-ui";
import { MobileAppSession } from "../sessions/mobile-app-session";
import { ElementArray, Element } from "webdriverio";

export type MobileAppElementOptions = Merge<UiElementOptions, {
    locator: string;
}>;

export type MobileAppFacetOptions = Merge<UiFacetOptions, {
    locator?: string;
    session?: MobileAppSession<any>;
    parent?: MobileAppFacet;
}>;

export class MobileAppFacet extends UiFacet<MobileAppFacetOptions> {
    override get locator(): string {
        return super.locator as string;
    }
    override get session(): MobileAppSession<any> {
        return super.session as MobileAppSession<any>;
    }
    override get parent(): MobileAppFacet {
        return super.parent as MobileAppFacet;
    }

    override async getElements(options: MobileAppElementOptions): Promise<ElementArray> {
        return wait.forResult(() => retry.untilResult(() => {
            return this.getRoot().then(r => r.$$(options.locator));
        }, 100, 'linear'), options.maxWaitMs || 0);
    }

    override async getElement(options: MobileAppElementOptions): Promise<Element<'async'>> {
        return wait.forResult(() => retry.untilResult(() => {
            return this.getRoot()
                .then(r => r.$(options.locator));
        }, 100, 'linear'), options.maxWaitMs || 0);
    }
    
    override async getFacet<T extends UiFacet<MobileAppFacetOptions>>(facetType: Class<T>, options?: MobileAppFacetOptions): Promise<T> {
        options = options || {} as MobileAppFacetOptions;
        options.parent = options.parent || this;
        options.session = options.session || this.session;
        options.logMgr = options.logMgr || this.logMgr;
        options.maxWaitMs = (options.maxWaitMs === undefined) ? this.maxWaitMs : options.maxWaitMs;
        let facet: T = new facetType(options);
        return facet;
    }
    
    override async getRoot(): Promise<Element<'async'>>  {
        return wait.forResult(() => retry.untilResult(() => {
            if (this.parent) {
                return this.parent.getRoot()
                    .then(r => r.$$(this.locator))
                    .then(els => els[this.index]);
            } else {
                return this.session.driver.$$(this.locator)
                    .then(els => els[this.index]);
            }
        }, 100, 'linear'), this.maxWaitMs);
    }
}