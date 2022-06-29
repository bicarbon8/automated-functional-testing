import { rand } from "aft-core";
import { MobileAppSessionGeneratorPlugin, MobileAppSession, MobileAppSessionGeneratorPluginOptions, MobileAppSessionOptions } from "../../src";
import { RemoteOptions } from "webdriverio";

describe('AbstractMobileAppGridSessionGeneratorPlugin', () => {
    beforeEach(() => {
        jasmine.getEnv().allowRespy(true);
    });
    
    it('can generate capabilities from the passed in SessionOptions', async () => {
        let caps: {} = {
            'custom1': `custom1-${rand.getString(10)}`,
            'custom2': `custom2-${rand.getString(10)}`,
            'custom3': `custom3-${rand.getString(10)}`,
            'custom4': `custom4-${rand.getString(10)}`
        };
        let session: FakeMobileAppSessionGeneratorPlugin = new FakeMobileAppSessionGeneratorPlugin({remoteOptions: {capabilities: caps}});
        let actual: RemoteOptions = await session.getRemoteOptions();

        for (var prop in caps) {
            expect(actual.capabilities[prop]).toEqual(caps[prop]);
        }
    });
});

class FakeMobileAppSessionGeneratorPlugin extends MobileAppSessionGeneratorPlugin<MobileAppSessionGeneratorPluginOptions> {
    async newUiSession(options?: MobileAppSessionOptions): Promise<MobileAppSession> {
        return new MobileAppSession({
            driver: options?.driver || await this.createDriver(options),
            logMgr: options?.logMgr || this.logMgr,
            uiplatform: options?.uiplatform || this.uiplatform.toString(),
            app: options?.app || this.app
        });
    }
    async dispose(error?: Error): Promise<void> {
        /* do nothing */
    }
    async sendCommand(command: string, data?: any): Promise<any> {
        /* do nothing */
        return null;
    }
}