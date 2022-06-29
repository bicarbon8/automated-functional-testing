import { FakeDriver } from "./fake-driver";
import { Class, Merge } from "aft-core";
import { UiFacet, UiFacetOptions, UiSession, UiSessionOptions } from "../../src";

export type FakeSessionOptions = Merge<UiSessionOptions, {
    driver: FakeDriver;
}>;

export class FakeSession extends UiSession<FakeSessionOptions> {
    disposeCount: number;
    disposeErrors: Error[];
    goToStrings: string[];
    refreshCount: number;
    resizeValues: object[];

    private _driver: FakeDriver;

    get driver(): FakeDriver {
        if (!this._driver) {
            this._driver = this.option('driver');
        }
        return this._driver;
    }
    
    override async getFacet<F extends UiFacet<Fo>, Fo extends UiFacetOptions>(facetType: Class<F>, options?: Fo): Promise<F> {
        options = options || {} as Fo;
        options.index = options.index || 0;
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: F = new facetType(options);
        return facet;
    }
    async goTo(url: string): Promise<FakeSession> {
        this.goToStrings.push(url);
        return this;
    }
    async refresh(): Promise<FakeSession> {
        this.refreshCount++;
        return this;
    }
    async resize(width: number, height: number): Promise<FakeSession> {
        this.resizeValues.push({w: width, h: height});
        return this;
    }
    async dispose(err?: Error): Promise<void> {
        this.disposeCount++;
        this.disposeErrors.push(err);
    }
}