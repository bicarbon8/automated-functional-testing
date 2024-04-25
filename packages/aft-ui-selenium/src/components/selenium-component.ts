import { Func } from "aft-core";
import { UiComponent } from "aft-ui";
import { Locator, WebDriver, WebElement } from "selenium-webdriver";

export class SeleniumComponent extends UiComponent {
    override get driver(): WebDriver {
        return this._driver as WebDriver;
    }
    override get parent(): Func<void, Promise<WebElement | WebDriver>> {
        return this._parent as Func<void, Promise<WebElement | WebDriver>>;
    }
    override get locator(): Locator {
        return this._locator as Locator;
    }
    override async getRoot(): Promise<WebElement> {
        const searchContext = (this.parent != null) ? await this.parent() : this.driver;
        return searchContext.findElement(this.locator);
    }
}