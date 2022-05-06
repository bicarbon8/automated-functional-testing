import { FakeDriver } from "./fake-driver";
import { Clazz, LogManager } from "aft-core";
import { AbstractFacet, ISession, ISessionOptions, TestPlatform } from "../../src";
import { FakeFacetOptions } from "../facets/fake-facet";

export interface FakeSessionOptions extends ISessionOptions {
    driver?: FakeDriver;
}

export class FakeSession implements ISession {
    disposeCount: number;
    disposeErrors: Error[];
    goToStrings: string[];
    refreshCount: number;
    resizeValues: object[];
    readonly driver: FakeDriver;
    readonly platform: TestPlatform;
    readonly logMgr: LogManager;
    constructor(options: FakeSessionOptions) {
        this.driver = options.driver;
        this.platform = TestPlatform.parse(options.platform);
        this.logMgr = options.logMgr;
        this.disposeCount = 0;
        this.disposeErrors = [];
        this.goToStrings = [];
        this.refreshCount = 0;
        this.resizeValues = [];
    }
    async getFacet<T extends AbstractFacet>(facetType: Clazz<T>, options?: FakeFacetOptions): Promise<T> {
        options = options || {};
        options.session = options.session || this;
        options.logMgr = options.logMgr || this.logMgr;
        let facet: T = new facetType(options);
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