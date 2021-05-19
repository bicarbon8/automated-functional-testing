import { MobileAppSession } from "../mobile-app-session";

export class SauceLabsMobileAppSession extends MobileAppSession {
    async dispose(error: any): Promise<void> {
        try {
            await this.driver?.execute(`sauce:job-result=${(error) ? 'failed' : 'passed'}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }

        await super.dispose(error);
    }
}