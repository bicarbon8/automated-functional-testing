import { BrowserSession } from "../browser-session";

export class SauceLabsBrowserSession extends BrowserSession {
    async dispose(error: any): Promise<void> {
        try {
            await this.driver?.executeScript(`sauce:job-result=${(error) ? 'failed' : 'passed'}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }

        await super.dispose(error);
    }
}