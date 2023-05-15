import { Func } from "aft-core";
import { Element, Browser } from "webdriverio";
import { UiComponent } from "aft-ui";

export class WebdriverIoComponent extends UiComponent {
    override get driver(): Browser<'async'> {
        return this._driver as Browser<'async'>;
    }
    override get locator(): string {
        return this._locator as string;
    }
    override get parent(): Func<void, Promise<Element<'async'>>> {
        return this._parent as Func<void, Promise<Element<'async'>>>;
    }
    override async getRoot(): Promise<Element<'async'>>  {
        const searchCtx = (this.parent) ? await this.parent() : this.driver;
        return await searchCtx.$(this.locator);
    }
}