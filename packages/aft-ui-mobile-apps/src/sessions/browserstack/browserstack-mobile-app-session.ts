import { MobileAppSession } from "../mobile-app-session";

export class BrowserStackMobileAppSession extends MobileAppSession {
    override async dispose(error?: any): Promise<void> {
        try {
            let setStatus: {} = {
                "action": "setSessionStatus",
                "arguments": {
                    "status": (error) ? 'failed' : 'passed',
                    "reason": error || 'successful test'
                }
            };
            await this.driver?.execute(`browserstack_executor: ${JSON.stringify(setStatus)}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }
        
        await super.dispose(error);
    }
}