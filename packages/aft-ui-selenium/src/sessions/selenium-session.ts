import { Err } from "aft-core";
import { UiSession } from "aft-ui";
import { WebDriver } from "selenium-webdriver";

export class SeleniumSession extends UiSession {
    override async dispose(error?: any): Promise<void> {
        await super.dispose(error);
        await Err.handleAsync(async () => (await this.driver<WebDriver>())?.close());
        await Err.handleAsync(async () => (await this.driver<WebDriver>())?.quit());
    }
}