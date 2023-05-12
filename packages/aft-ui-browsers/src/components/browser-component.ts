import { Func } from "aft-core";
import { UiComponent } from "aft-ui";
import { By, WebDriver, WebElement } from "selenium-webdriver";

export class BrowserComponent extends UiComponent {
    override get driver(): WebDriver {
        return this._driver as WebDriver;
    }
    override get parent(): Func<void, Promise<WebElement>> {
        return this._parent as Func<void, Promise<WebElement>>;
    }
    override get locator(): By {
        return this._locator as By;
    }
    override async getRoot(): Promise<WebElement> {
        const searchContext = (this.parent != null) ? await this.parent() : this.driver;
        return searchContext.findElement(this.locator);
    }
}