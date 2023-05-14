import { Func } from "aft-core";
import { UiComponent } from "aft-ui";
import { Locator, WebDriver, WebElement } from "selenium-webdriver";

export class SeleniumComponent extends UiComponent {
    override get driver(): WebDriver {
        return this._driver as WebDriver;
    }
    override get parent(): Func<void, Promise<WebElement>> {
        return this._parent as Func<void, Promise<WebElement>>;
    }
    override get locator(): Locator {
        return this._locator as Locator;
    }
    override async getRoot(): Promise<WebElement> {
        const searchContext = (this.parent != null) ? await this.parent() : this.driver;
        return await searchContext.findElement(this.locator);
    }
}