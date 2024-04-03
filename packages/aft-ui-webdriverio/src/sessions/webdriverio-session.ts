import { Err } from "aft-core";
import { UiSession } from "aft-ui";

export class WebdriverIoSession extends UiSession {
    override async dispose(error?: any): Promise<void> {
        await super.dispose(error);
        await Err.handleAsync(async () => await this.driver<WebdriverIO.Browser>().then(d => d.deleteSession())); // eslint-disable-line no-undef
    }
}
