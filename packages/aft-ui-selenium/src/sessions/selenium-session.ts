import { Err } from "aft-core";
import { UiSession } from "aft-ui";
import { WebDriver } from "selenium-webdriver";

export class SeleniumSession extends UiSession {
    override async dispose(error?: any): Promise<void> {
        await super.dispose(error);
        const handledClose = await Err.handleAsync(() => this.driver<WebDriver>().then(d => d?.close()));
        if (handledClose.message) {
            await this.reporter.trace(handledClose.message);
        }
        const handledQuit = await Err.handleAsync(() => this.driver<WebDriver>().then(d => d?.quit()));
        if (handledQuit.message) {
            await this.reporter.trace(handledQuit.message);
        }
    }
}
