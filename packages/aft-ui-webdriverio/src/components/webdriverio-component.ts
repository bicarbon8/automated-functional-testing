import { Func } from "aft-core";
import { UiComponent } from "aft-ui";

export class WebdriverIoComponent extends UiComponent {
    override get driver(): WebdriverIO.Browser {
        return this._driver as WebdriverIO.Browser;
    }
    override get locator(): string {
        return this._locator as string;
    }
    override get parent(): Func<void, Promise<WebdriverIO.Element>> {
        return this._parent as Func<void, Promise<WebdriverIO.Element>>;
    }
    override async getRoot(): Promise<WebdriverIO.Element>  {
        const searchCtx = (this.parent) ? await this.parent() : this.driver;
        return await searchCtx.$(this.locator);
    }
}