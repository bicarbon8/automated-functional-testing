import { Func } from "aft-core";
import { UiComponent } from "../../src";
import { FakeDriver } from "./fake-driver";
import { FakeElement } from "./fake-element";
import { FakeLocator } from "./fake-locator";

export class FakeComponent extends UiComponent {
    override get driver(): FakeDriver {
        return this._driver as FakeDriver;
    }
    override get parent(): Func<void, Promise<FakeElement>> {
        return this._parent as Func<void, Promise<FakeElement>>;
    }
    override get locator(): FakeLocator {
        return this._locator as FakeLocator;
    }
    override async getRoot(): Promise<FakeElement> {
        const searchCtx = (this.parent) ? await this.parent() : this.driver;
        return searchCtx.findFakeElement(this.locator);
    }
}