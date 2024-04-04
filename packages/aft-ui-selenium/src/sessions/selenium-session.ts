import { Err } from "aft-core";
import { UiSession } from "aft-ui";
import { WebDriver } from "selenium-webdriver";

export class SeleniumSession extends UiSession {
    override async dispose(error?: any): Promise<void> {
        await super.dispose(error);
        await Err.handleAsync(() => this.driver<WebDriver>().then(d => d?.close()));
        await Err.handleAsync(() => this.driver<WebDriver>().then(d => d?.quit()));
    }
}
