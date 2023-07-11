import { Func } from "aft-core";
import { Element, Browser } from "webdriverio";
import { UiComponent } from "aft-ui";

export class WebdriverIoComponent extends UiComponent {
    override get driver(): Browser {
        return this._driver as Browser;
    }
    override get locator(): string {
        return this._locator as string;
    }
    override get parent(): Func<void, Promise<Element>> {
        return this._parent as Func<void, Promise<Element>>;
    }
    override async getRoot(): Promise<Element>  {
        const searchCtx = (this.parent) ? await this.parent() : this.driver;
        return await searchCtx.$(this.locator);
    }
}