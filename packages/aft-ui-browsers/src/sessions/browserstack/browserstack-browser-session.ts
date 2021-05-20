import { BrowserSession } from "../browser-session";

export class BrowserStackBrowserSession extends BrowserSession {
    async dispose(error?: any): Promise<void> {
        try {
            let setStatus: {} = {
                "action": "setSessionStatus",
                "arguments": {
                    "status": (error) ? 'failed' : 'passed',
                    "reason": error || 'successful test'
                }
            };
            await this.driver?.executeScript(`browserstack_executor: ${JSON.stringify(setStatus)}`);
        } catch (e) {
            await this.logMgr.warn(e);
        }
        
        await super.dispose(error);
    }
}